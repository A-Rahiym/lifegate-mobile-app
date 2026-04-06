package ai

import (
"bytes"
"context"
"encoding/json"
"fmt"
"io"
"net/http"
"strings"
"time"

"github.com/DiniMuhd7/lifegate-mobile-app/backend/internal/config"
)

var httpClient = &http.Client{Timeout: 60 * time.Second}

type openAIProvider struct {
apiKey string
model  string
}

func NewOpenAIProvider(cfg *config.Config) AIProvider {
return &openAIProvider{apiKey: cfg.OpenAIAPIKey, model: cfg.OpenAIModel}
}

func (o *openAIProvider) Name() string { return "openai" }

func (o *openAIProvider) Chat(ctx context.Context, systemPrompt string, messages []ChatMessage) (*AIResponse, error) {
type openAIMessage struct {
Role    string `json:"role"`
Content string `json:"content"`
}

msgs := []openAIMessage{{Role: "system", Content: systemPrompt}}
for _, m := range messages {
role := "user"
if strings.EqualFold(m.Role, "AI") {
role = "assistant"
}
msgs = append(msgs, openAIMessage{Role: role, Content: m.Text})
}

body := map[string]interface{}{
"model":       o.model,
"messages":    msgs,
"temperature": 0.7,
}
payload, err := json.Marshal(body)
if err != nil {
return nil, err
}

req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.openai.com/v1/chat/completions", bytes.NewReader(payload))
if err != nil {
return nil, err
}
req.Header.Set("Content-Type", "application/json")
req.Header.Set("Authorization", "Bearer "+o.apiKey)

resp, err := httpClient.Do(req)
if err != nil {
return nil, err
}
defer resp.Body.Close()

if resp.StatusCode != http.StatusOK {
b, _ := io.ReadAll(resp.Body)
return nil, fmt.Errorf("openai error %d: %s", resp.StatusCode, string(b))
}

var result struct {
Choices []struct {
Message struct {
Content string `json:"content"`
} `json:"message"`
} `json:"choices"`
}
if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
return nil, err
}
if len(result.Choices) == 0 {
return nil, fmt.Errorf("openai returned no choices")
}

return parseAIResponse(result.Choices[0].Message.Content)
}

func parseAIResponse(content string) (*AIResponse, error) {
content = strings.TrimSpace(content)

// Strip markdown code fences if present.
if idx := strings.Index(content, "```json"); idx != -1 {
content = content[idx+7:]
if end := strings.Index(content, "```"); end != -1 {
content = content[:end]
}
} else if idx := strings.Index(content, "```"); idx != -1 {
content = content[idx+3:]
if end := strings.Index(content, "```"); end != -1 {
content = content[:end]
}
}
content = strings.TrimSpace(content)

// If the AI prepended prose before the JSON object, locate the first { and
// last } to extract just the JSON object, discarding any surrounding text.
if !strings.HasPrefix(content, "{") {
if start := strings.Index(content, "{"); start != -1 {
content = content[start:]
}
}
if end := strings.LastIndex(content, "}"); end != -1 && end < len(content)-1 {
content = content[:end+1]
}

var aiResp AIResponse
if err := json.Unmarshal([]byte(content), &aiResp); err != nil {
// Return an error so the EDIS engine uses its user-safe graceful fallback
// instead of forwarding raw JSON to the client as message text.
return nil, fmt.Errorf("parseAIResponse: failed to unmarshal AI response: %w", err)
}
return &aiResp, nil
}
