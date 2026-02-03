# backend-ai-api (delta)

## ADDED Requirements

### Requirement: Chat endpoint

The backend SHALL provide `POST /api/ai/chat` that accepts a JSON body with a `messages` array (each item having `role` and `content` as per OpenAI chat format) and SHALL return the assistant reply in the unified response format (code 200, msg "success", data containing the assistant message content or equivalent). The endpoint SHALL use the ai-sdk to call an OpenAI-compatible LLM.

#### Scenario: chat returns assistant reply

- **WHEN** a client sends `POST /api/ai/chat` with a valid body `{ "messages": [ { "role": "user", "content": "Hello" } ] }`
- **THEN** the response body is `{ "code": 200, "msg": "success", "data": <object containing assistant reply> }` and HTTP status is 200

#### Scenario: chat fails when upstream config missing

- **WHEN** `OPENAI_BASE_URL` or `OPENAI_API_KEY` is not set and a client sends `POST /api/ai/chat`
- **THEN** the backend SHALL respond with an error (e.g. 503 or 400) using the unified response format (fail) and a message indicating configuration is missing

### Requirement: OpenAI config via environment

The backend SHALL read OpenAI-compatible endpoint configuration from environment variables only: `OPENAI_BASE_URL` (base URL of the API) and `OPENAI_API_KEY` (API key). The backend MUST NOT hardcode API keys or default base URLs in source code.

#### Scenario: config read from env

- **WHEN** the backend starts and `OPENAI_BASE_URL` and `OPENAI_API_KEY` are set in the environment
- **THEN** the chat endpoint SHALL use these values when calling the LLM provider

#### Scenario: no fallback when env missing

- **WHEN** either `OPENAI_BASE_URL` or `OPENAI_API_KEY` is missing
- **THEN** the chat endpoint SHALL NOT attempt to call the LLM and SHALL return an error response indicating missing configuration
