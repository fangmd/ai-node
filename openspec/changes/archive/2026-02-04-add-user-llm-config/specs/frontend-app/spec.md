## MODIFIED Requirements

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

