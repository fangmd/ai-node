## ADDED Requirements

### Requirement: AI model logging uses the common backend logger

Any AI model request/response logging (including AI SDK middleware logging) SHALL use the common backend logger under `apps/backend/src/common/` (Pino-based) and SHALL NOT use `console.*`.

#### Scenario: Middleware emits logs through common logger
- **WHEN** AI model logging is enabled for a `doGenerate` or `doStream` invocation
- **THEN** the backend emits structured logs via the common logger module (e.g. `logger.info` / `logger.debug`) and does not emit application logs via `console.*`

### Requirement: AI model logs are structured and correlatable

AI model request/response logs SHALL be structured JSON logs and SHALL support correlation by including request metadata fields when available (e.g. requestId, userId, sessionId, provider, modelId, baseURL).

#### Scenario: Correlation fields present
- **WHEN** the backend emits AI model request/response logs and request metadata is available
- **THEN** the emitted JSON log entries include those correlation fields as top-level structured fields

### Requirement: AI model logs are privacy-aware (redaction and truncation)

AI model request/response logs SHALL redact secrets by default (at minimum Authorization / API keys) and SHALL support truncating large or sensitive payload fields to a configured maximum size.

#### Scenario: Secrets are redacted in AI model logs
- **WHEN** AI model request/response logs include credential-like fields
- **THEN** the log output contains redacted placeholders instead of the raw secret values

#### Scenario: Payload fields are truncated
- **WHEN** prompt/output/tool payload fields exceed the configured maximum size
- **THEN** the log output contains truncated values and indicates truncation occurred

