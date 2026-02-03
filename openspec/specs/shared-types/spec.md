# shared-types

## Purpose

Shared TypeScript types package for frontend and backend: single source of truth for API-related types (e.g. `ApiResponse`), consumed by both apps to ensure type safety and consistent contracts.

## Requirements

### Requirement: shared types package location

The repository SHALL provide a shared types package under `packages/types`. The package MUST be a workspace package with its own `package.json` and MUST be included in the pnpm workspace (e.g. `packages/*` in `pnpm-workspace.yaml`).

#### Scenario: workspace includes types package

- **WHEN** user runs `pnpm install` at repository root
- **THEN** the types package is installed and resolvable by other workspace packages (e.g. `apps/backend`, `apps/frontend`)

### Requirement: ApiResponse export

The shared types package SHALL export the `ApiResponse<T>` type. The type MUST define `code: number`, `msg: string`, and `data: T` (generic, defaulting to `object`). The package MUST expose this type via a public entry (e.g. `index.ts` or `main`/`types` in `package.json`).

#### Scenario: ApiResponse is importable

- **WHEN** a workspace package imports `ApiResponse` from the shared types package (e.g. `import type { ApiResponse } from "@ai-node/types"`)
- **THEN** the type is available and matches the API response shape (code, msg, data)

### Requirement: backend consumes shared types

The backend SHALL depend on the shared types package (e.g. `"@ai-node/types": "workspace:*"`). The backend response helpers (e.g. `success`, `fail`) SHALL use the shared `ApiResponse` type (import from the types package); the backend MUST NOT define a duplicate `ApiResponse` type locally.

#### Scenario: backend uses shared ApiResponse

- **WHEN** the backend builds or type-checks
- **THEN** it resolves `ApiResponse` from the shared types package and produces no type errors for response usage

### Requirement: frontend may consume shared types

The frontend MAY depend on the shared types package. When the frontend calls the backend API, it MAY use `ApiResponse<T>` from the shared types package to type response data.

#### Scenario: frontend types API response

- **WHEN** the frontend imports `ApiResponse` from the shared types package and uses it to type an API response
- **THEN** the type aligns with the backend response shape and frontend type-check passes
