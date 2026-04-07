// Package edis implements the Early Detection Intelligence System (EDIS) —
// LifeGate's probabilistic reasoning engine.
//
// EDIS wraps any ai.AIProvider with:
//   - A hard 30-second context timeout and graceful fallback (no raw error exposed)
//   - Probabilistic condition ranking with per-condition confidence scores
//   - Context-aware follow-up question generation
//   - Early-stage risk flag detection and severity classification
//   - Auto-escalation of General Mode to Clinical Mode on threshold breach
//   - Low-confidence detection with mandatory physician-review flag
package edis

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/DiniMuhd7/lifegate-mobile-app/backend/internal/ai"
)

// ─── Thresholds ───────────────────────────────────────────────────────────────

const (
	// LowConfidenceThreshold is the minimum primary-diagnosis confidence below which
	// the response is flagged for mandatory physician review, even in General mode.
	LowConfidenceThreshold = 60

	// TimeoutDuration is the hard wall-clock limit for the entire Process call
	// including all retries. When exceeded, Process returns a graceful fallback.
	TimeoutDuration = 45 * time.Second

	// maxRetries is the number of additional attempts after the first failure.
	// Total attempts = 1 + maxRetries.
	maxRetries = 2

	// retryBaseDelay is the initial back-off delay between retries.
	// Each subsequent retry doubles the delay (1 s → 2 s).
	retryBaseDelay = 1 * time.Second
)

// ─── Risk flag codes ─────────────────────────────────────────────────────────

const (
	FlagEarlyInfection   = "EARLY_INFECTION_RISK"
	FlagCardiac          = "CARDIAC_RISK"
	FlagNeurological     = "NEUROLOGICAL_RISK"
	FlagRespiratory      = "RESPIRATORY_RISK"
	FlagMetabolic        = "METABOLIC_RISK"
	FlagMentalHealth     = "MENTAL_HEALTH_CRISIS"
	FlagSepsis           = "SEPSIS_RISK"
	FlagHypertensive     = "HYPERTENSIVE_CRISIS"
	FlagPediatric        = "PEDIATRIC_CONCERN"
	FlagObstetric        = "OBSTETRIC_RISK"
	FlagGastrointestinal = "GASTROINTESTINAL_RISK"
	FlagRenal            = "RENAL_RISK"
)

// ─── Response type ────────────────────────────────────────────────────────────

// EDISResponse embeds the full AI provider response and adds EDIS-derived metadata.
type EDISResponse struct {
	*ai.AIResponse

	// EscalationTrigger is non-empty when General → Clinical escalation occurred
	// and records the reason, e.g. "urgency_threshold_breach:HIGH".
	EscalationTrigger string `json:"escalationTrigger,omitempty"`

	// LowConfidence is true when the primary diagnosis confidence < LowConfidenceThreshold.
	LowConfidence bool `json:"lowConfidence,omitempty"`

	// NeedsPhysicianReview is true whenever the response must enter the physician queue
	// (low confidence, escalation, or HIGH/CRITICAL risk flag).
	NeedsPhysicianReview bool `json:"needsPhysicianReview,omitempty"`

	// Escalated is true when General Mode has been automatically escalated to Clinical Mode.
	Escalated bool `json:"escalated,omitempty"`
}

// ─── PatientContext ──────────────────────────────────────────────────────────

// PatientContext holds the patient's clinical profile retrieved from the
// LifeGate EMR. All fields are optional — zero/empty values are omitted from
// the system prompt so they do not mislead the AI.
type PatientContext struct {
	Name               string
	Age                int    // 0 = unknown
	Gender             string
	BloodType          string
	Allergies          string
	MedicalHistory     string
	CurrentMedications string
}

// ─── Engine ───────────────────────────────────────────────────────────────────

// Engine is the EDIS runtime that wraps an ai.AIProvider.
type Engine struct {
	provider ai.AIProvider
}

// NewEngine returns an EDIS Engine backed by the given AI provider.
func NewEngine(provider ai.AIProvider) *Engine {
	return &Engine{provider: provider}
}

// ProviderName returns the name of the underlying AI provider.
func (e *Engine) ProviderName() string {
	return e.provider.Name()
}

// Ping sends a minimal message to the AI provider and returns any error.
// Unlike Process, Ping does NOT apply a graceful fallback — errors are propagated
// directly so callers (e.g. the health-check handler) can detect provider unavailability.
func (e *Engine) Ping(ctx context.Context) error {
	resp, err := e.provider.Chat(ctx, "You are a health-check assistant. Reply with {\"text\":\"pong\"}.",
		[]ai.ChatMessage{{Role: "USER", Text: "ping"}})
	if err != nil {
		return err
	}
	if resp == nil || resp.Text == "" {
		return fmt.Errorf("AI provider returned empty response")
	}
	return nil
}

// Process runs the full EDIS pipeline for a conversation history.
//
//  1. Applies a hard 45-second context timeout (covers all retries).
//  2. Builds the EDIS system prompt for the given category, injecting the
//     patient's clinical record so the AI can avoid allergenic prescriptions,
//     detect drug interactions, and contextualise differentials.
//  3. Calls the AI provider with up to maxRetries retries on transient errors,
//     using exponential back-off. Retries are skipped when the context is
//     already cancelled (e.g. the hard timeout was hit).
//  4. On persistent failure or timeout, returns a graceful fallback — never
//     propagates the error to the caller.
//  5. Analyses the raw response to compute escalation, low-confidence, and
//     physician-review flags.
func (e *Engine) Process(ctx context.Context, messages []ai.ChatMessage, category string, patient PatientContext) (*EDISResponse, error) {
	timeoutCtx, cancel := context.WithTimeout(ctx, TimeoutDuration)
	defer cancel()

	prompt := buildEDISPrompt(category, patient)

	var (
		raw     *ai.AIResponse
		lastErr error
	)

	for attempt := 0; attempt <= maxRetries; attempt++ {
		// If the overall deadline has already passed, stop retrying.
		if timeoutCtx.Err() != nil {
			log.Printf("[EDIS] context cancelled before attempt %d (category=%s): %v", attempt+1, category, timeoutCtx.Err())
			break
		}

		// Back-off before each retry (not before the first attempt).
		if attempt > 0 {
			delay := retryBaseDelay * time.Duration(1<<uint(attempt-1)) // 1s, 2s, …
			log.Printf("[EDIS] retry %d/%d after %v (category=%s provider=%s): %v",
				attempt, maxRetries, delay, category, e.provider.Name(), lastErr)
			select {
			case <-time.After(delay):
			case <-timeoutCtx.Done():
				log.Printf("[EDIS] context cancelled during back-off (category=%s): %v", category, timeoutCtx.Err())
				break
			}
			if timeoutCtx.Err() != nil {
				break
			}
		}

		raw, lastErr = e.provider.Chat(timeoutCtx, prompt, messages)
		if lastErr == nil {
			// Success — stop retrying.
			break
		}
	}

	if lastErr != nil {
		log.Printf("[EDIS] all attempts failed (category=%s provider=%s attempts=%d): %v",
			category, e.provider.Name(), maxRetries+1, lastErr)
		return gracefulFallback(), nil
	}

	return analyze(raw), nil
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

// analyze derives escalation metadata from a raw AIResponse and returns an EDISResponse.
func analyze(raw *ai.AIResponse) *EDISResponse {
	resp := &EDISResponse{AIResponse: raw}

	// Ensure mode is set.
	if raw.Mode == "" {
		raw.Mode = "general"
	}

	// ── Diagnosis synthesis fallback ───────────────────────────────────────────
	// If the AI returned conditions and/or investigations but omitted a primary
	// diagnosis, promote the top-ranked condition so the patient always sees a
	// diagnosis card after triage — not just a bare list of possibilities.
	if raw.Diagnosis == nil && len(raw.Conditions) > 0 && raw.Conditions[0].Confidence >= 50 {
		top := raw.Conditions[0]
		raw.Diagnosis = &ai.Diagnosis{
			Condition:   top.Condition,
			Urgency:     synthesisUrgency(top.Confidence, raw.Investigations),
			Description: top.Description,
			Confidence:  top.Confidence,
		}
	}

	// ── Low-confidence detection ───────────────────────────────────────────────
	// A diagnosis with confidence present but below threshold → mandatory review.
	if raw.Diagnosis != nil && raw.Diagnosis.Confidence > 0 && raw.Diagnosis.Confidence < LowConfidenceThreshold {
		resp.LowConfidence = true
		resp.NeedsPhysicianReview = true
	}

	// ── Urgency-based escalation ───────────────────────────────────────────────
	// HIGH or CRITICAL urgency triggers General → Clinical escalation.
	if raw.Diagnosis != nil {
		urg := strings.ToUpper(raw.Diagnosis.Urgency)
		if urg == "HIGH" || urg == "CRITICAL" {
			resp.Escalated = true
			resp.EscalationTrigger = fmt.Sprintf("urgency_threshold_breach:%s", urg)
			resp.NeedsPhysicianReview = true
		}
	}

	// ── Risk-flag-based escalation ─────────────────────────────────────────────
	// Any HIGH or CRITICAL severity risk flag triggers escalation and physician review.
	for _, flag := range raw.RiskFlags {
		sev := strings.ToUpper(flag.Severity)
		if sev == "HIGH" || sev == "CRITICAL" {
			resp.Escalated = true
			resp.NeedsPhysicianReview = true
			if resp.EscalationTrigger == "" {
				resp.EscalationTrigger = fmt.Sprintf("risk_flag:%s", flag.Flag)
			}
		}
	}

	// ── Mode update ────────────────────────────────────────────────────────────
	// Any escalation signal promotes the response to Clinical mode.
	if resp.Escalated || resp.LowConfidence {
		raw.Mode = "clinical"
	}

	return resp
}

// gracefulFallback returns a user-safe response when the AI provider fails or times out.
func gracefulFallback() *EDISResponse {
	return &EDISResponse{
		AIResponse: &ai.AIResponse{
			Text: "I'm having a little trouble right now — it might be a brief connection issue. " +
				"Please try sending your message again in a moment. " +
				"If you're experiencing a medical emergency, please call 199 immediately.",
			Mode: "general",
		},
	}
}

// buildEDISPrompt constructs the full system prompt by combining:
//   1. The base EDIS/health system prompt
//   2. The patient's clinical record (if available)
//   3. The category-specific snippet
func buildEDISPrompt(category string, patient PatientContext) string {
	base := ai.HealthSystemPrompt
	patientBlock := buildPatientContextBlock(patient)
	if patientBlock != "" {
		base = base + "\n\n" + patientBlock
	}
	if snippet, ok := ai.CategoryPromptSnippets[category]; ok {
		return base + "\n\n" + snippet
	}
	return base
}

// buildPatientContextBlock formats the patient's clinical profile into a
// structured block that is injected into the system prompt. Fields that are
// empty or unknown are omitted so the AI does not fabricate data.
func buildPatientContextBlock(p PatientContext) string {
	if p.Name == "" && p.Age == 0 && p.Gender == "" && p.BloodType == "" &&
		p.Allergies == "" && p.MedicalHistory == "" && p.CurrentMedications == "" {
		return ""
	}

	var b strings.Builder
	b.WriteString("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
	b.WriteString("PATIENT CLINICAL RECORD (LifeGate EMR — verified)\n")
	b.WriteString("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

	if p.Name != "" {
		fmt.Fprintf(&b, "Name          : %s\n", p.Name)
	}
	if p.Age > 0 {
		fmt.Fprintf(&b, "Age           : %d years old\n", p.Age)
	}
	if p.Gender != "" {
		fmt.Fprintf(&b, "Sex           : %s\n", p.Gender)
	}
	if p.BloodType != "" {
		fmt.Fprintf(&b, "Blood Type    : %s\n", p.BloodType)
	}
	if p.Allergies != "" {
		fmt.Fprintf(&b, "Allergies     : %s\n", p.Allergies)
	}
	if p.MedicalHistory != "" {
		fmt.Fprintf(&b, "Medical Hx    : %s\n", p.MedicalHistory)
	}
	if p.CurrentMedications != "" {
		fmt.Fprintf(&b, "Current Meds  : %s\n", p.CurrentMedications)
	}

	b.WriteString("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
	b.WriteString("SAFETY RULES — YOU MUST FOLLOW THESE:\n")
	b.WriteString("• NEVER prescribe or suggest any medication the patient is documented as allergic to.\n")
	b.WriteString("• CHECK for drug interactions between your suggestions and the patient's current medications.\n")
	b.WriteString("• USE the patient's existing conditions to sharpen your differential diagnoses.\n")
	b.WriteString("• RAISE urgency appropriately when comorbidities increase vulnerability (e.g. diabetes, immunosuppression).\n")
	b.WriteString("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	return b.String()
}

// synthesisUrgency maps a top-condition confidence score (and presence of investigations)
// to an urgency level for a synthesised diagnosis.
func synthesisUrgency(confidence int, investigations []ai.Investigation) string {
	// If any URGENT or STAT test is recommended the case warrants at least MEDIUM urgency.
	for _, inv := range investigations {
		urg := strings.ToUpper(inv.Urgency)
		if urg == "STAT" {
			return "HIGH"
		}
		if urg == "URGENT" {
			return "MEDIUM"
		}
	}
	if confidence >= 75 {
		return "MEDIUM"
	}
	return "LOW"
}
