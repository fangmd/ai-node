## ADDED Requirements

### Requirement: React SPA with Vite

The frontend SHALL be a React single-page application built with Vite. The app MUST have an HTML entry and a JS/TS entry that mounts a React root. The package MUST have `dev` and `build` scripts; `dev` SHALL start the Vite dev server; `build` SHALL run Vite build for production assets.

#### Scenario: dev server runs

- **WHEN** user runs the frontend's `dev` script
- **THEN** the Vite dev server starts and serves the app (e.g. on port 5173)

#### Scenario: production build

- **WHEN** user runs the frontend's `build` script
- **THEN** static assets are emitted to the configured output directory

### Requirement: API base URL via env

The frontend SHALL use an environment variable for the API base URL (e.g. `VITE_API_ORIGIN` or `VITE_API_URL`). The dev setup SHALL allow this to point to the backend (e.g. `http://localhost:3000`). Documentation or `.env.example` MUST state the variable name and expected value for local development.

#### Scenario: frontend calls backend

- **WHEN** the frontend is run in dev with the env variable set to the backend origin
- **THEN** API requests from the app are sent to the backend and CORS permits the response

### Requirement: frontend in apps directory

The frontend SHALL live under `apps/frontend`. It MUST be a workspace package with its own `package.json` and MUST be included in the Turborepo pipeline.

#### Scenario: turbo runs frontend tasks

- **WHEN** user runs `turbo run build` or `turbo run dev` from root
- **THEN** the frontend package is included and its scripts are executed
