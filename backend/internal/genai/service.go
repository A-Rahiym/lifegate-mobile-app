package genai

import (
"context"
"database/sql"
"encoding/json"

"github.com/DiniMuhd7/lifegate-mobile-app/backend/internal/ai"
natsclient "github.com/DiniMuhd7/lifegate-mobile-app/backend/internal/nats"
)

type Service struct {
aiProvider ai.AIProvider
db         *sql.DB
nats       *natsclient.Client
}

func NewService(aiProvider ai.AIProvider, db *sql.DB, nats *natsclient.Client) *Service {
return &Service{aiProvider: aiProvider, db: db, nats: nats}
}

type ChatRequest struct {
Message          string           `json:"message"`
PreviousMessages []ai.ChatMessage `json:"previousMessages"`
UserID           string
}

func (s *Service) Chat(ctx context.Context, req ChatRequest) (*ai.AIResponse, error) {
eventData, _ := json.Marshal(map[string]string{
"user_id": req.UserID,
"message": req.Message,
})
_ = s.nats.Publish("patient.symptom.submitted", eventData)

messages := append(req.PreviousMessages, ai.ChatMessage{Role: "USER", Text: req.Message})
resp, err := s.aiProvider.Chat(ctx, ai.HealthSystemPrompt, messages)
if err != nil {
return nil, err
}

if req.UserID != "" {
s.saveDiagnosis(req.UserID, req.Message, resp)
}

if resp.Diagnosis != nil {
diagData, _ := json.Marshal(map[string]interface{}{
"user_id":   req.UserID,
"diagnosis": resp.Diagnosis,
})
_ = s.nats.Publish("ai.diagnosis.preliminary", diagData)
}

return resp, nil
}

func (s *Service) saveDiagnosis(userID, message string, resp *ai.AIResponse) {
aiJSON, _ := json.Marshal(resp)
runes := []rune(message)
title := message
if len(runes) > 100 {
title = string(runes[:100])
}

condition := ""
urgency := ""
if resp.Diagnosis != nil {
condition = resp.Diagnosis.Condition
urgency = resp.Diagnosis.Urgency
}

_, _ = s.db.Exec(
`INSERT INTO diagnoses (user_id, title, description, condition, urgency, ai_response, status)
 VALUES ($1, $2, $3, $4, $5, $6, 'Pending')`,
userID, title, resp.Text, condition, urgency, aiJSON,
)
}
