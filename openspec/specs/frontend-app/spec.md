# frontend-app

## Purpose

React SPA with Vite: entry, relative-path API requests (dev proxy / production nginx), and monorepo integration.

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

The frontend SHALL NOT use an environment variable for the API base URL (e.g. `VITE_API_ORIGIN`). The frontend SHALL use **relative paths** for all API requests (e.g. `/api/ai/chat`, `/api/me`). In development, the Vite dev server SHALL proxy requests under `/api` to the backend (e.g. via `server.proxy` in `vite.config.ts`). In production, the deployment SHALL use a reverse proxy (e.g. nginx) to forward `/api` to the backend so that the frontend and API are same-origin. Documentation SHALL describe the Vite proxy and production proxy configuration; `.env.example` and README SHALL NOT require or document `VITE_API_ORIGIN`.

#### Scenario: frontend calls backend in dev via proxy

- **WHEN** the frontend is run in dev and the app sends a request to a relative path (e.g. `/api/me` or `/api/ai/chat`)
- **THEN** the request is proxied by Vite to the backend and the response is returned to the app

#### Scenario: frontend uses relative paths only

- **WHEN** any page or module makes an API request
- **THEN** the request URL SHALL be a relative path (e.g. `/api/...`) and SHALL NOT be built from `VITE_API_ORIGIN` or any other env-based origin

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

### Requirement: Chat UI

The frontend SHALL provide a chat page (or view) that allows the user to send messages to the backend chat API and display streamed assistant replies. The page SHALL use **useChat** (e.g. from `@ai-sdk/react`) with a transport (e.g. **DefaultChatTransport**) pointing at the chat endpoint. The transport SHALL send the request header `Authorization: Bearer <token>` when the user has a stored token (e.g. from `getToken()` in `lib/auth`). Input state SHALL be managed locally (e.g. `useState`); submission SHALL be via the hook's send API (e.g. `sendMessage`).

The chat page SHALL include a model selector UI (e.g. a dropdown) placed above or near the message input. The selector SHALL be populated from the user's saved LLM configs (see `llm-config`) and SHALL reflect the model bound to the current session:
- If the current session has a bound `llmConfigId`, the selector SHALL show that config as selected.
- If the current session's `llmConfigId` is empty, the selector SHALL default to the user's default LLM config.
- If the user has no usable LLM configs, the chat page SHALL show an explicit empty state prompting the user to configure an LLM config in settings before chatting.

When creating a new session (no sessionId), the frontend SHALL include the selected `llmConfigId` in the `POST /api/ai/chat` request so the backend can bind the new session to that config. When the user changes the selected model while a session is active, the frontend SHALL update the session binding by including `sessionId` and the newly selected `llmConfigId` in the next chat request.

The message list SHALL render messages from **message.parts**: text parts as streamed text; **tool-web_search** parts SHALL show a "正在搜索…" (or equivalent) state while the tool is running and SHALL show "引用来源" (citation sources) with links when the tool result provides `output.sources`. The page SHALL show stream/status (e.g. submitted or streaming) and SHALL display errors from the hook. The page SHALL include an input for composing messages and a message list that shows user and assistant messages; assistant content SHALL be rendered as it arrives from the UI message stream.

#### Scenario: user sends message and sees streamed reply
- **WHEN** the user is on the chat page, has a usable LLM config selected (or the session is bound to one), enters a message, and submits (e.g. send button or Enter)
- **THEN** the message is sent to `POST /api/ai/chat` (or the configured chat endpoint) in UIMessage format with `Authorization: Bearer <token>` when token exists, the response is consumed as a UI message stream (e.g. via useChat), and the assistant reply appears incrementally in the message list with text and any tool parts (e.g. "正在搜索…" then "引用来源" when web search returns sources)

#### Scenario: chat page is reachable via route
- **WHEN** the user navigates to the chat route (e.g. `/chat`)
- **THEN** the chat page is rendered with input and message list, and in-app navigation to/from the chat route works without full page reload

#### Scenario: chat request includes auth header when logged in
- **WHEN** the user has a valid stored token and submits a message on the chat page
- **THEN** the request to the chat endpoint SHALL include the header `Authorization: Bearer <token>` where `<token>` is the stored value

#### Scenario: new session includes llmConfigId for binding
- **WHEN** the user is in a new-session state (no sessionId) and submits the first message
- **THEN** the request body to `POST /api/ai/chat` includes `llmConfigId` equal to the currently selected model config id

#### Scenario: user sees empty state when no configs
- **WHEN** the user opens the chat page and the LLM config list is empty
- **THEN** the UI shows an explicit prompt to go to settings to add an LLM config, and prevents sending messages until configured
