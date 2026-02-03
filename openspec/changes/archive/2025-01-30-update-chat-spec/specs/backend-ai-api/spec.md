# backend-ai-api (delta)

## MODIFIED Requirements

### Requirement: Chat endpoint

The backend SHALL provide `POST /api/ai/chat` that accepts a JSON body with a `messages` array in **UIMessage format** (AI SDK UI message format: each item has `id`, `role`, and `parts`). The endpoint SHALL convert UIMessages to model messages (e.g. via `convertToModelMessages`) and SHALL call the ai-sdk `streamText` with an OpenAI-compatible model and a **web_search** tool (e.g. provider `webSearch`). The response SHALL be a **UI message stream** (e.g. `toUIMessageStreamResponse` with `originalMessages`), not plain text SSE. The stream SHALL carry text deltas, tool-call and tool-result parts so that clients (e.g. useChat) can render message parts. The endpoint SHALL use the ai-sdk to call an OpenAI-compatible LLM (e.g. Responses API).

#### Scenario: chat streams UI message reply

- **WHEN** a client sends `POST /api/ai/chat` with a valid body `{ "messages": [ <UIMessage> ] }` (e.g. a user message with `role: "user"` and `parts: [{ type: "text", text: "Hello" }]`)
- **THEN** the response is a UI message stream (e.g. `Content-Type` and format compatible with AI SDK UI message stream), HTTP status 200, and the body delivers assistant reply content including text deltas and any tool-call/tool-result parts (e.g. web_search) until the stream ends

#### Scenario: chat fails when upstream config missing

- **WHEN** `OPENAI_BASE_URL` or `OPENAI_API_KEY` is not set and a client sends `POST /api/ai/chat`
- **THEN** the backend SHALL respond with an error (e.g. 503 or 400) using a non-streaming response (e.g. JSON with unified fail format) and a message indicating configuration is missing
