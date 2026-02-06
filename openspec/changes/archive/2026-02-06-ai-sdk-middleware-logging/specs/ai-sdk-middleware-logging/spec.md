## ADDED Requirements

### Requirement: Middleware captures AI SDK-level request/response payloads

The backend SHALL provide an optional AI SDK Language Model Middleware that can be applied via `wrapLanguageModel`.
When enabled, the middleware SHALL log the following for each model invocation:

- The full `params` passed to the model `doGenerate` / `doStream` call (AI SDK-level request payload)
- The full result returned by `doGenerate` (AI SDK-level response payload), including any provider-specific metadata when available
- For `doStream`, the stream parts observed while streaming, and a final summary when the stream completes

#### Scenario: doGenerate logs request and response payload
- **WHEN** a model call runs via `doGenerate` with the logging middleware enabled
- **THEN** the backend emits a structured log entry containing the `params` payload and a structured log entry containing the `doGenerate` result payload

#### Scenario: doStream logs stream parts and final summary
- **WHEN** a model call runs via `doStream` with the logging middleware enabled
- **THEN** the backend emits structured log entries for stream parts as they occur and emits a final structured log entry when streaming finishes

### Requirement: Per-request metadata can be attached to logs

The middleware SHALL support attaching per-request metadata passed via `providerOptions` (e.g. requestId, userId, baseURL, sessionId) to all emitted log entries, so that logs from the same request can be correlated.

#### Scenario: request metadata is included
- **WHEN** a `streamText` call provides metadata via `providerOptions`
- **THEN** all middleware-emitted log entries include that metadata as structured fields

### Requirement: Logs are safe by default (redaction and truncation)

When the middleware logs request/response payloads, it SHALL redact secrets by default, including at minimum:
- Authorization / bearer tokens
- API keys

The middleware SHALL support truncating large fields (e.g. prompts, outputs, tool arguments/results) to a configurable maximum size to prevent log amplification.

#### Scenario: sensitive fields are redacted
- **WHEN** the request/response payload contains fields commonly used for credentials (e.g. Authorization, apiKey)
- **THEN** the emitted logs include redacted placeholders instead of the original secret values

#### Scenario: large fields are truncated
- **WHEN** a request/response field exceeds the configured maximum size
- **THEN** the emitted logs contain a truncated value and indicate truncation occurred

### Requirement: Logging is gated (environment and sampling)

The middleware logging SHALL be disabled by default.
The backend SHALL provide configuration to enable the logging middleware in development, and SHALL support sampling (e.g. a percentage) to limit volume when enabled.

#### Scenario: disabled by default
- **WHEN** the backend runs with default configuration
- **THEN** the logging middleware is not enabled and does not emit model request/response logs

#### Scenario: sampling limits log volume
- **WHEN** sampling is configured and the middleware is enabled
- **THEN** only a sampled subset of model invocations produce middleware logs

