# frontend-app

## Purpose

React SPA with Vite: entry, env-based API URL, and monorepo integration.

## Requirements

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

### Requirement: Tailwind CSS v4
The frontend SHALL use Tailwind CSS v4 for styling. The project MUST install `tailwindcss` and `@tailwindcss/vite`; the Vite config MUST include the `@tailwindcss/vite` plugin. The global CSS entry (e.g. `src/index.css`) MUST contain `@import "tailwindcss"` so that Tailwind utility classes are available. No separate `tailwind.config.js` is required for default usage (v4 uses automatic content detection when using the Vite plugin).

#### Scenario: Tailwind utilities apply
- **WHEN** a component uses Tailwind utility classes (e.g. `className="text-3xl font-bold"`)
- **THEN** the styles are applied in dev and in production build

#### Scenario: dev and build include Tailwind
- **WHEN** user runs `dev` or `build`
- **THEN** Tailwind CSS is processed by the Vite plugin and output CSS includes the used utilities

### Requirement: React Router (component-based routing)
The frontend SHALL use React Router for client-side routing with **component-based routing** (not file-based). The app MUST use `react-router-dom`, provide a router (e.g. `BrowserRouter`), and define routes with `<Routes>` and `<Route>` (or equivalent). The app MUST have at least one route; navigation between routes MUST work without full page reload. Route definitions SHALL live in component code (e.g. a root routes config or layout component), not in the file system.

#### Scenario: in-app navigation
- **WHEN** the user navigates to a route (e.g. via `<Link>` or programmatic navigation)
- **THEN** the matching route component is rendered and the URL updates without a full page load

#### Scenario: direct URL and refresh
- **WHEN** the user opens or refreshes a non-root URL (e.g. `/about`)
- **THEN** the correct route is rendered and the app remains a SPA (no 404 for in-app routes)
