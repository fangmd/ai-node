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
The backend SHALL provide `POST /api/ai/chat` that accepts a JSON body with a `messages` array in **UIMessage format** (AI SDK UI message format: each item has `id`, `role`, and `parts`). The endpoint SHALL convert UIMessages to model messages (e.g. via `convertToModelMessages`) and SHALL call the ai-sdk `streamText` with an OpenAI-compatible model, a **web_search** tool (e.g. provider `webSearch`), and **local tools** (see Local tools). The response SHALL be a **UI message stream** (e.g. `toUIMessageStreamResponse` with `originalMessages`), not plain text SSE. The stream SHALL carry text deltas, tool-call and tool-result parts so that clients (e.g. useChat) can render message parts. The endpoint SHALL use the ai-sdk to call an OpenAI-compatible LLM (e.g. Responses API). The **provider** and **model** used SHALL be determined by environment variables (see OpenAI config via environment).

#### Scenario: chat streams UI message reply
- **WHEN** a client sends `POST /api/ai/chat` with a valid body `{ "messages": [ <UIMessage> ] }` (e.g. a user message with `role: "user"` and `parts: [{ type: "text", text: "Hello" }]`)
- **THEN** the response is a UI message stream (e.g. `Content-Type` and format compatible with AI SDK UI message stream), HTTP status 200, and the body delivers assistant reply content including text deltas and any tool-call/tool-result parts (e.g. web_search, local tools) until the stream ends

#### Scenario: chat fails when upstream config missing
- **WHEN** the required configuration for the selected provider (from `AI_PROVIDER` or default) is not set (e.g. for `openai`, `OPENAI_BASE_URL` or `OPENAI_API_KEY` is missing; for `deepseek`, `DEEPSEEK_BASE_URL` or `DEEPSEEK_API_KEY` is missing) and a client sends `POST /api/ai/chat`
- **THEN** the backend SHALL respond with an error (e.g. 503 or 400) using a non-streaming response (e.g. JSON with unified fail format) and a message indicating configuration is missing

### Requirement: OpenAI config via environment
The backend SHALL read Chat LLM configuration from environment variables only. The backend SHALL support **provider selection** via `AI_PROVIDER` (e.g. `openai`, `deepseek`) and **model identifier** via `AI_MODEL` (e.g. `gpt-5.2`, `deepseek-chat`). For each supported provider, the backend SHALL use that provider's own base URL and API key variables (e.g. `OPENAI_BASE_URL` and `OPENAI_API_KEY` for `openai`; `DEEPSEEK_BASE_URL` and `DEEPSEEK_API_KEY` for `deepseek`). The backend MUST NOT hardcode API keys or default base URLs in source code. When `AI_PROVIDER` is unset, the backend SHALL treat it as `openai` for backward compatibility.

#### Scenario: config read from env
- **WHEN** the backend starts and `AI_PROVIDER` (or default `openai`) and the corresponding provider's base URL and API key are set in the environment (e.g. `OPENAI_BASE_URL` and `OPENAI_API_KEY` for `openai`)
- **THEN** the chat endpoint SHALL use that provider and the value of `AI_MODEL` (or a provider-specific default model) when calling the LLM

#### Scenario: no fallback when env missing
- **WHEN** for the selected provider (from `AI_PROVIDER` or default), either the provider's base URL or API key is missing
- **THEN** the chat endpoint SHALL NOT attempt to call the LLM and SHALL return an error response indicating missing configuration

#### Scenario: model and provider from env
- **WHEN** `AI_PROVIDER` and `AI_MODEL` are set (e.g. `AI_PROVIDER=deepseek`, `AI_MODEL=deepseek-chat`) and the corresponding provider's base URL and API key are set
- **THEN** the chat endpoint SHALL use the configured provider and model when calling the LLM

### Requirement: DeepSeek provider dependency
The backend SHALL use the official DeepSeek provider from the AI SDK when `AI_PROVIDER=deepseek`. The project SHALL add the dependency with `pnpm add @ai-sdk/deepseek` (in the backend app). The chat endpoint SHALL use `@ai-sdk/deepseek` to create the DeepSeek language model instance, not a generic OpenAI-compatible client with a DeepSeek base URL.

#### Scenario: DeepSeek provider package installed
- **WHEN** the backend is built or installed
- **THEN** `@ai-sdk/deepseek` SHALL be listed as a dependency in the backend package (e.g. `apps/backend/package.json`)

#### Scenario: DeepSeek selected uses official provider
- **WHEN** `AI_PROVIDER=deepseek` and DeepSeek config is set and a client sends `POST /api/ai/chat`
- **THEN** the chat endpoint SHALL call the LLM via the provider created from `@ai-sdk/deepseek` (e.g. `createDeepSeek` or equivalent)

### Requirement: Local tools
The backend SHALL implement **local tools** (server-side tools callable by the model via the chat stream) under the **ai/tools** directory (e.g. `apps/backend/src/ai/tools/`). Local tools SHALL be registered with `streamText` together with provider tools (e.g. web_search). At least one local tool SHALL be available: **get_server_ip**, which returns the current server IP address.

#### Scenario: get_server_ip returns fixed value
- **WHEN** the model invokes the get_server_ip tool during a chat
- **THEN** the tool SHALL return the value `0.0.0.0` (fixed; no real network lookup)

#### Scenario: local tools under ai/tools
- **WHEN** the backend implements local tools
- **THEN** tool definitions SHALL live under the ai/tools directory (e.g. `src/ai/tools/` with an index or per-tool modules)
