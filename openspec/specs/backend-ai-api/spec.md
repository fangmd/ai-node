# backend-ai-api

## Purpose

AI API route group under `/api/ai`: Hono sub-app mount and initial hello endpoint; future AI endpoints (chat, completions, etc.) live under this group.

## Requirements

### Requirement: AI route group
The backend SHALL expose an AI API route group at path prefix `/api/ai`. All AI-related endpoints SHALL be mounted under this prefix via a Hono sub-app (e.g. `app.route('/api/ai', ai)`).

#### Scenario: AI group mounted
- **WHEN** the backend is running
- **THEN** requests to paths under `/api/ai/*` are handled by the AI route group

### Requirement: AI hello endpoint
The backend SHALL provide `GET /api/ai/hello` that returns a success response using the existing unified response format (code 200, msg "success", data).

#### Scenario: hello returns success
- **WHEN** a client sends `GET /api/ai/hello`
- **THEN** the response body is `{ "code": 200, "msg": "success", "data": <object> }` and HTTP status is 200

### Requirement: Chat endpoint
The backend SHALL provide `POST /api/ai/chat` that accepts a JSON body with a `messages` array (each item having `role` and `content` as per OpenAI chat format) and SHALL stream the assistant reply via HTTP Server-Sent Events (SSE). The response SHALL use `Content-Type: text/event-stream` and SHALL emit event stream chunks (e.g. `data: {...}`) containing incremental assistant content or a final envelope. The endpoint SHALL use the ai-sdk (e.g. `streamText`) to call an OpenAI-compatible LLM.

#### Scenario: chat streams assistant reply
- **WHEN** a client sends `POST /api/ai/chat` with a valid body `{ "messages": [ { "role": "user", "content": "Hello" } ] }`
- **THEN** the response has `Content-Type: text/event-stream`, HTTP status 200, and the body is an SSE stream that delivers assistant reply content (e.g. text deltas or structured chunks) until the stream ends

#### Scenario: chat fails when upstream config missing
- **WHEN** `OPENAI_BASE_URL` or `OPENAI_API_KEY` is not set and a client sends `POST /api/ai/chat`
- **THEN** the backend SHALL respond with an error (e.g. 503 or 400) using a non-streaming response (e.g. JSON with unified fail format) and a message indicating configuration is missing

### Requirement: OpenAI config via environment
The backend SHALL read OpenAI-compatible endpoint configuration from environment variables only: `OPENAI_BASE_URL` (base URL of the API) and `OPENAI_API_KEY` (API key). The backend MUST NOT hardcode API keys or default base URLs in source code.

#### Scenario: config read from env
- **WHEN** the backend starts and `OPENAI_BASE_URL` and `OPENAI_API_KEY` are set in the environment
- **THEN** the chat endpoint SHALL use these values when calling the LLM provider

#### Scenario: no fallback when env missing
- **WHEN** either `OPENAI_BASE_URL` or `OPENAI_API_KEY` is missing
- **THEN** the chat endpoint SHALL NOT attempt to call the LLM and SHALL return an error response indicating missing configuration
