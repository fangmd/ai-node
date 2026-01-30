## MODIFIED Requirements

### Requirement: Chat endpoint
The backend SHALL provide `POST /api/ai/chat` that accepts a JSON body with a `messages` array (each item having `role` and `content` as per OpenAI chat format) and SHALL stream the assistant reply via HTTP Server-Sent Events (SSE). The response SHALL use `Content-Type: text/event-stream` and SHALL emit event stream chunks (e.g. `data: {...}`) containing incremental assistant content or a final envelope. The endpoint SHALL use the ai-sdk (e.g. `streamText`) to call an OpenAI-compatible LLM.

#### Scenario: chat streams assistant reply
- **WHEN** a client sends `POST /api/ai/chat` with a valid body `{ "messages": [ { "role": "user", "content": "Hello" } ] }`
- **THEN** the response has `Content-Type: text/event-stream`, HTTP status 200, and the body is an SSE stream that delivers assistant reply content (e.g. text deltas or structured chunks) until the stream ends

#### Scenario: chat fails when upstream config missing
- **WHEN** `OPENAI_BASE_URL` or `OPENAI_API_KEY` is not set and a client sends `POST /api/ai/chat`
- **THEN** the backend SHALL respond with an error (e.g. 503 or 400) using a non-streaming response (e.g. JSON with unified fail format) and a message indicating configuration is missing
