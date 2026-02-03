# backend-mysql-prisma

## Purpose

Backend uses Prisma to connect to MySQL. Connection and configuration are provided via environment variables. Includes minimal schema and a single Prisma Client instance for future business tables.

## Requirements

### Requirement: Database connection from env

The backend SHALL connect to MySQL using Prisma. The connection URL MUST be read from the environment variable `DATABASE_URL`. The format SHALL be `mysql://USER:PASSWORD@HOST:PORT/DATABASE`. The backend MUST NOT hardcode connection parameters in source code.

#### Scenario: Connection uses DATABASE_URL

- **WHEN** the backend uses Prisma Client to access the database
- **THEN** the connection is established using the value of `DATABASE_URL` from the process environment

### Requirement: Prisma schema in backend

The backend SHALL include a Prisma schema at `apps/backend/prisma/schema.prisma`. The schema MUST declare a MySQL datasource whose URL is `env("DATABASE_URL")`. The schema MAY contain a minimal or placeholder model to allow client generation; it SHALL be extensible for future business tables.

#### Scenario: Schema declares MySQL datasource

- **WHEN** the Prisma schema is present under `apps/backend/prisma/`
- **THEN** the datasource block uses `provider = "mysql"` and `url = env("DATABASE_URL")`

### Requirement: Single Prisma Client instance

The backend SHALL expose a single shared Prisma Client instance (singleton). All code that needs database access MUST use this instance. The instance SHALL be created once and reused to avoid multiple connections.

#### Scenario: One client instance used

- **WHEN** any backend module imports the Prisma Client
- **THEN** it receives the same singleton instance used elsewhere in the app

### Requirement: Prisma Client generation

The backend package SHALL ensure Prisma Client is generated after install or before use. The package MUST provide a script (e.g. `prisma generate` or a postinstall step) so that running the backend does not fail due to missing generated client.

#### Scenario: Client available after setup

- **WHEN** a developer runs `pnpm install` in the repo and then runs the backend's dev or build script
- **THEN** Prisma Client is available and the backend can start without generation errors

### Requirement: DATABASE_URL in .env.example

The backend SHALL document the required database configuration in `.env.example`. The file MUST include a `DATABASE_URL` example (e.g. `mysql://USER:PASSWORD@HOST:PORT/DATABASE`) so that local and deployment environments can be configured correctly.

#### Scenario: Example connection string documented

- **WHEN** a developer or operator reads `apps/backend/.env.example`
- **THEN** they see a commented or example `DATABASE_URL` line with the expected format
