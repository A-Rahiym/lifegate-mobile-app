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

	// TimeoutDuration is the hard wall-clock limit for every AI provider call.
	// When exceeded, Engine.Process returns a graceful fallback — never a raw error.
	TimeoutDuration = 30 * time.Second
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
//  1. Applies a hard 30-second context timeout.
//  2. Builds the EDIS system prompt for the given category.
//  3. Calls the AI provider.
//  4. On any error or timeout, returns a graceful fallback — never propagates the error.
//  5. Analyses the raw response to compute escalation, low-confidence, and physician-review flags.
func (e *Engine) Process(ctx context.Context, messages []ai.ChatMessage, category string) (*EDISResponse, error) {
	timeoutCtx, cancel := context.WithTimeout(ctx, TimeoutDuration)
	defer cancel()

	prompt := buildEDISPrompt(category)

	raw, err := e.provider.Chat(timeoutCtx, prompt, messages)
	if err != nil {
		log.Printf("[EDIS] provider error (category=%s provider=%s): %v", category, e.provider.Name(), err)
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

// buildEDISPrompt constructs the full system prompt for a given category by
// appending the category-specific snippet to the base EDIS prompt.
func buildEDISPrompt(category string) string {
	base := ai.HealthSystemPrompt
	if snippet, ok := ai.CategoryPromptSnippets[category]; ok {
		return base + "\n\n" + snippet
	}
	return base
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
