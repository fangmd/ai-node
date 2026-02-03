# backend-env-config (delta)

## ADDED Requirements

### Requirement: Single config load and entry

The backend SHALL load environment variables in exactly one place (e.g. a single module under `src/common`). Dotenv SHALL be invoked only there; all other application code MUST obtain configuration via that module and MUST NOT call `process.env` directly or load dotenv themselves.

#### Scenario: Config loaded before app starts

- **WHEN** the backend process starts
- **THEN** the config module is imported first (e.g. at the top of the entry file), and dotenv is run once before any route or service code runs

#### Scenario: No direct env access in app code

- **WHEN** any module under `src/` (except the config module and build/config tooling) needs a configuration value
- **THEN** it SHALL import from the single config module and SHALL NOT read from `process.env` or load dotenv

### Requirement: Startup validation of required variables

The backend SHALL validate required configuration at startup. Required variables SHALL be defined (e.g. in a schema). If any required variable is missing or invalid, the process MUST exit with a non-zero code and MUST print a clear error message indicating which variable failed and why (e.g. missing vs invalid format); the message MUST NOT include secret values.

#### Scenario: Missing required variable

- **WHEN** a required variable (e.g. `DATABASE_URL` or `JWT_SECRET`) is not set or is empty
- **THEN** the process exits before starting the HTTP server and prints an error that identifies the variable and the failure reason

#### Scenario: Invalid format for validated variable

- **WHEN** a required variable has a format that fails validation (e.g. URL format for `DATABASE_URL`)
- **THEN** the process exits before starting the HTTP server and prints an error that identifies the variable and the validation failure

### Requirement: Typed and grouped config export

The config module SHALL export a typed configuration object. The shape SHALL be defined by a single schema (e.g. zod) so that TypeScript types and runtime validation stay in sync. Configuration SHALL be grouped by domain (e.g. server, auth, database, ai, proxy) so that consumers can import only the subset they need.

#### Scenario: Consumers get typed config

- **WHEN** a module imports config (or a subgroup) from the config module
- **THEN** it receives a typed object; TypeScript types SHALL be derived from the same schema used for validation

#### Scenario: Grouped access

- **WHEN** a module needs only one domain (e.g. auth or database)
- **THEN** it MAY import only that group (e.g. `config.auth` or `config.database`) and SHALL NOT be required to depend on unrelated config

### Requirement: Load order and files

The config module SHALL load dotenv in a deterministic order: first `.env.example` (if present, for defaults/documentation), then `.env` (for local overrides). Production deployment MAY rely only on environment variables already set by the host; the same module SHALL be used in all environments and SHALL NOT change deployment contract (no new config server or file paths required).

#### Scenario: Local development with .env

- **WHEN** the backend runs locally with a `.env` file present
- **THEN** values from `.env` override those from `.env.example`, and the application uses the merged result after validation

#### Scenario: Production without .env file

- **WHEN** the backend runs in production with variables set by the environment (e.g. process.env)
- **THEN** the config module SHALL read those variables and validate them the same way; no `.env` file is required
