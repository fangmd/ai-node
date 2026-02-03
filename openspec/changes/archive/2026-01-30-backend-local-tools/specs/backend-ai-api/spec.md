# backend-ai-api (delta)

## MODIFIED Requirements

### Requirement: Chat endpoint

The backend SHALL provide `POST /api/ai/chat` that accepts a JSON body with a `messages` array in **UIMessage format** (AI SDK UI message format: each item has `id`, `role`, and `parts`). The endpoint SHALL convert UIMessages to model messages (e.g. via `convertToModelMessages`) and SHALL call the ai-sdk `streamText` with an OpenAI-compatible model, a **web_search** tool (e.g. provider `webSearch`), and **local tools** (see Local tools). The response SHALL be a **UI message stream** (e.g. `toUIMessageStreamResponse` with `originalMessages`), not plain text SSE. The stream SHALL carry text deltas, tool-call and tool-result parts so that clients (e.g. useChat) can render message parts. The endpoint SHALL use the ai-sdk to call an OpenAI-compatible LLM (e.g. Responses API).

#### Scenario: chat streams UI message reply

- **WHEN** a client sends `POST /api/ai/chat` with a valid body `{ "messages": [ <UIMessage> ] }` (e.g. a user message with `role: "user"` and `parts: [{ type: "text", text: "Hello" }]`)
- **THEN** the response is a UI message stream (e.g. `Content-Type` and format compatible with AI SDK UI message stream), HTTP status 200, and the body delivers assistant reply content including text deltas and any tool-call/tool-result parts (e.g. web_search, local tools) until the stream ends

#### Scenario: chat fails when upstream config missing

- **WHEN** `OPENAI_BASE_URL` or `OPENAI_API_KEY` is not set and a client sends `POST /api/ai/chat`
- **THEN** the backend SHALL respond with an error (e.g. 503 or 400) using a non-streaming response (e.g. JSON with unified fail format) and a message indicating configuration is missing

## ADDED Requirements

### Requirement: Local tools

The backend SHALL implement **local tools** (server-side tools callable by the model via the chat stream) under the **ai/tools** directory (e.g. `apps/backend/src/ai/tools/`). Local tools SHALL be registered with `streamText` together with provider tools (e.g. web_search). At least one local tool SHALL be available: **get_server_ip**, which returns the current server IP address.

#### Scenario: get_server_ip returns fixed value

- **WHEN** the model invokes the get_server_ip tool during a chat
- **THEN** the tool SHALL return the value `0.0.0.0` (fixed; no real network lookup)

#### Scenario: local tools under ai/tools

- **WHEN** the backend implements local tools
- **THEN** tool definitions SHALL live under the ai/tools directory (e.g. `src/ai/tools/` with an index or per-tool modules)
