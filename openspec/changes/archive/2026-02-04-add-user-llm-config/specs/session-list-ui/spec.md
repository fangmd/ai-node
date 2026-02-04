## MODIFIED Requirements

### Requirement: Session list display

The frontend SHALL display a session list (e.g. sidebar or dedicated area) showing the current user's chat sessions. Each list item SHALL show session identifier and MAY show title and/or last update time. The list SHALL be populated from the backend (e.g. `GET /api/ai/sessions`). Each session item provided by the backend MAY include `llmConfigId` to indicate which model configuration is bound to the session.

#### Scenario: session list shows user sessions
- **WHEN** the user is on the chat page and sessions exist for the current user
- **THEN** the session list SHALL display those sessions (e.g. id, title, updateTime)

#### Scenario: session list empty when no sessions
- **WHEN** the user has no sessions yet
- **THEN** the session list SHALL be empty or show an empty state

#### Scenario: session items carry llmConfigId for binding
- **WHEN** the backend returns sessions that are bound to an LLM config
- **THEN** the frontend SHALL store/track each session's `llmConfigId` so the chat UI can restore model selection for that session

### Requirement: Current session state with zustand

The frontend SHALL use zustand (version ^5.0.9) to manage session list and current session. The store SHALL hold at least: session list (e.g. `{ id, title?, updateTime, llmConfigId? }[]`), current session id (e.g. `currentSessionId: string | null`), and the current session's bound `llmConfigId` (directly or derivable from the session list). Session ids SHALL be the string representation of backend Session Snowflake ids.

#### Scenario: store holds session list and current session
- **WHEN** the app loads or fetches sessions
- **THEN** the zustand store SHALL contain sessionList and currentSessionId; currentSessionId SHALL be set when user selects a session or when a new session is created and returned by the backend

#### Scenario: new session clears current session id
- **WHEN** the user clicks "new session" (or equivalent)
- **THEN** currentSessionId SHALL be set to null and the chat input SHALL be cleared without calling the backend to create a session

### Requirement: New session on first message

The frontend SHALL provide a "new session" entry (e.g. button or link). Clicking it SHALL NOT create a session on the backend; the session SHALL be created only when the user sends the first message. Until then, the frontend SHALL send chat requests without a sessionId; after the backend returns a new sessionId (e.g. via stream or response), the frontend SHALL update the store with the new session (including its `llmConfigId` binding) and set it as current.

#### Scenario: new session entry does not call backend
- **WHEN** the user clicks the new session entry
- **THEN** no request to create a session SHALL be sent; the UI SHALL clear the current conversation and set currentSessionId to null

#### Scenario: first message creates session with model binding
- **WHEN** the user is in "new session" state (currentSessionId is null), has selected a model config in the chat UI, and sends the first message
- **THEN** the frontend SHALL send `POST /api/ai/chat` with messages, without sessionId, and with `llmConfigId`; the backend SHALL create the session and return the new sessionId; the frontend SHALL update the store with the new session and its `llmConfigId` binding and set currentSessionId so that subsequent messages use that sessionId

### Requirement: Switch session and load messages

The frontend SHALL allow the user to select a session from the list. When a session is selected, the frontend SHALL set currentSessionId to that session's id and SHALL load that session's messages (e.g. via `GET /api/ai/sessions/:sessionId/messages`) and SHALL use them to initialize the chat view (e.g. useChat initialMessages). The chat UI SHALL also restore the model selection to the session's bound `llmConfigId` (or to the user's default when the session binding is empty).

#### Scenario: selecting session loads its messages
- **WHEN** the user selects a session from the list
- **THEN** currentSessionId SHALL be set to that session's id and the chat area SHALL display that session's messages loaded from the backend

#### Scenario: chat request includes session id when session selected
- **WHEN** the user has a session selected (currentSessionId is not null) and sends a message
- **THEN** the frontend SHALL send `POST /api/ai/chat` with body including sessionId equal to currentSessionId

