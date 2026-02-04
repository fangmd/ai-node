# backend-logging

## Purpose

Unified, structured logging for the backend using a single Pino-based logger from common, with configurable levels and JSON output suitable for production.

## Requirements

### Requirement: Unified logger in common

The backend SHALL provide a single logging module under `apps/backend/src/common/` (e.g. `logger.ts` or `log.ts`). The module SHALL be built on Pino and SHALL export a shared logger instance (and MAY export child-logger helpers). All application code that needs to emit logs MUST use this module and MUST NOT use `console.log`, `console.warn`, or `console.error` for application logging.

#### Scenario: Logger imported from common

- **WHEN** any module under `apps/backend/src/` needs to log
- **THEN** it SHALL import the logger from the common logging module and SHALL use the logger's methods (e.g. `info`, `warn`, `error`, `debug`) instead of `console.*`

#### Scenario: No console logging in app code

- **WHEN** the codebase is audited for logging
- **THEN** there SHALL be no remaining `console.log` / `console.warn` / `console.error` in backend application code (excluding build/config or test utilities if documented)

### Requirement: JSON log output

The logger SHALL emit log lines in JSON format. Each log line SHALL be a single JSON object with at least: level, message, and timestamp (or equivalent fields produced by Pino). The format SHALL be suitable for production log aggregation and SHALL NOT be human-only (e.g. not prettified by default in production).

#### Scenario: Production log line is valid JSON

- **WHEN** the backend runs in production (or default mode) and a log entry is written
- **THEN** the output for that entry SHALL be a single line that is valid JSON and SHALL contain level and message (and typically timestamp)

#### Scenario: Development may use readable format

- **WHEN** the backend runs in development and a human-readable format is desired
- **THEN** the implementation MAY use a transport or option (e.g. pino-pretty) to format logs for readability; the default export SHALL still be JSON in the absence of such configuration

### Requirement: Log levels and interface

The common logger SHALL support at least the levels: `debug`, `info`, `warn`, `error`. The module SHALL expose methods that accept a message string and optional structured fields (e.g. object). The minimum log level SHALL be configurable (e.g. via environment variable such as `LOG_LEVEL`); logs below that level SHALL NOT be emitted.

#### Scenario: Level-based filtering

- **WHEN** `LOG_LEVEL` (or equivalent) is set to e.g. `info`
- **THEN** the logger SHALL emit `info`, `warn`, and `error` and SHALL NOT emit `debug`

#### Scenario: Structured context

- **WHEN** a caller logs with additional context (e.g. `logger.info({ reqId, path }, 'Request received')`)
- **THEN** the emitted JSON SHALL include those fields so that log aggregators can index or filter by them

### Requirement: Single replacement of console.log

The change SHALL replace all existing uses of `console.log` (and relevant `console.warn` / `console.error`) in the backend codebase with the common logger in one pass. After the change, application logging SHALL originate only from the common logging module.

#### Scenario: Entry and routes use logger

- **WHEN** the backend process starts or handles a request (e.g. in `index.ts`, routes, services, AI, middleware)
- **THEN** any logging SHALL be done via the common logger and SHALL NOT be done via `console.*`
