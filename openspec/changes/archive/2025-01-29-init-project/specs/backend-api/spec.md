## ADDED Requirements

### Requirement: Hono app entry
The backend SHALL be a Hono application. The app MUST have an entry file (e.g. `src/index.ts`) that creates a Hono instance, attaches routes and CORS, and listens on a configurable port (default 3000).

#### Scenario: server listens
- **WHEN** the backend is started (dev or production)
- **THEN** the HTTP server listens on the configured port and responds to requests

### Requirement: CORS for frontend dev
The backend SHALL enable CORS in development so that the frontend dev server (e.g. origin `http://localhost:5173`) can call the API. CORS MAY be implemented via Hono middleware or built-in options.

#### Scenario: cross-origin request from frontend
- **WHEN** the frontend dev app sends a request to the backend API
- **THEN** the backend responds with appropriate CORS headers and the browser allows the response

### Requirement: Vite build for backend
The backend SHALL be built with Vite. Build MUST produce a Node-runnable bundle (e.g. single file or entry). The package MUST have `dev` and `build` scripts; `dev` SHALL run the app in development (e.g. vite-node or Vite dev server for Node); `build` SHALL run Vite build with Node target.

#### Scenario: build output runnable
- **WHEN** user runs the backend's `build` script
- **THEN** output can be run with `node` and the server starts correctly

### Requirement: backend in apps directory
The backend SHALL live under `apps/backend`. It MUST be a workspace package with its own `package.json` and MUST be included in the Turborepo pipeline.

#### Scenario: turbo runs backend tasks
- **WHEN** user runs `turbo run build` or `turbo run dev` from root
- **THEN** the backend package is included and its scripts are executed
