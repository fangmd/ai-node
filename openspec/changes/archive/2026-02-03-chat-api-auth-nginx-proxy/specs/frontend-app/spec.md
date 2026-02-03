## MODIFIED Requirements

### Requirement: API base URL via env
The frontend SHALL NOT use an environment variable for the API base URL (e.g. `VITE_API_ORIGIN`). The frontend SHALL use **relative paths** for all API requests (e.g. `/api/ai/chat`, `/api/me`). In development, the Vite dev server SHALL proxy requests under `/api` to the backend (e.g. via `server.proxy` in `vite.config.ts`). In production, the deployment SHALL use a reverse proxy (e.g. nginx) to forward `/api` to the backend so that the frontend and API are same-origin. Documentation SHALL describe the Vite proxy and production proxy configuration; `.env.example` and README SHALL NOT require or document `VITE_API_ORIGIN`.

#### Scenario: frontend calls backend in dev via proxy
- **WHEN** the frontend is run in dev and the app sends a request to a relative path (e.g. `/api/me` or `/api/ai/chat`)
- **THEN** the request is proxied by Vite to the backend and the response is returned to the app

#### Scenario: frontend uses relative paths only
- **WHEN** any page or module makes an API request
- **THEN** the request URL SHALL be a relative path (e.g. `/api/...`) and SHALL NOT be built from `VITE_API_ORIGIN` or any other env-based origin

### Requirement: Chat UI
The frontend SHALL provide a chat page (or view) that allows the user to send messages to the backend chat API and display streamed assistant replies. The page SHALL use **useChat** (e.g. from `@ai-sdk/react`) with a transport (e.g. **DefaultChatTransport**) pointing at the chat endpoint. The transport SHALL send the request header `Authorization: Bearer <token>` when the user has a stored token (e.g. from `getToken()` in `lib/auth`). Input state SHALL be managed locally (e.g. `useState`); submission SHALL be via the hook's send API (e.g. `sendMessage`). The message list SHALL render messages from **message.parts**: text parts as streamed text; **tool-web_search** parts SHALL show a "正在搜索…" (or equivalent) state while the tool is running and SHALL show "引用来源" (citation sources) with links when the tool result provides `output.sources`. The page SHALL show stream/status (e.g. submitted or streaming) and SHALL display errors from the hook. The page SHALL include an input for composing messages and a message list that shows user and assistant messages; assistant content SHALL be rendered as it arrives from the UI message stream.

#### Scenario: user sends message and sees streamed reply
- **WHEN** the user is on the chat page, enters a message, and submits (e.g. send button or Enter)
- **THEN** the message is sent to `POST /api/ai/chat` (or the configured chat endpoint) in UIMessage format with `Authorization: Bearer <token>` when token exists, the response is consumed as a UI message stream (e.g. via useChat), and the assistant reply appears incrementally in the message list with text and any tool parts (e.g. "正在搜索…" then "引用来源" when web search returns sources)

#### Scenario: chat page is reachable via route
- **WHEN** the user navigates to the chat route (e.g. `/chat`)
- **THEN** the chat page is rendered with input and message list, and in-app navigation to/from the chat route works without full page reload

#### Scenario: chat request includes auth header when logged in
- **WHEN** the user has a valid stored token and submits a message on the chat page
- **THEN** the request to the chat endpoint SHALL include the header `Authorization: Bearer <token>` where `<token>` is the stored value
