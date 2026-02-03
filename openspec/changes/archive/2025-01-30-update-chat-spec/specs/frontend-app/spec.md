# frontend-app (delta)

## MODIFIED Requirements

### Requirement: Chat UI

The frontend SHALL provide a chat page (or view) that allows the user to send messages to the backend chat API and display streamed assistant replies. The page SHALL use **useChat** (e.g. from `@ai-sdk/react`) with a transport (e.g. **DefaultChatTransport**) pointing at the chat endpoint. Input state SHALL be managed locally (e.g. `useState`); submission SHALL be via the hook’s send API (e.g. `sendMessage`). The message list SHALL render messages from **message.parts**: text parts as streamed text; **tool-web_search** parts SHALL show a “正在搜索…” (or equivalent) state while the tool is running and SHALL show “引用来源” (citation sources) with links when the tool result provides `output.sources`. The page SHALL show stream/status (e.g. submitted or streaming) and SHALL display errors from the hook. The page SHALL include an input for composing messages and a message list that shows user and assistant messages; assistant content SHALL be rendered as it arrives from the UI message stream.

#### Scenario: user sends message and sees streamed reply

- **WHEN** the user is on the chat page, enters a message, and submits (e.g. send button or Enter)
- **THEN** the message is sent to `POST /api/ai/chat` (or the configured chat endpoint) in UIMessage format, the response is consumed as a UI message stream (e.g. via useChat), and the assistant reply appears incrementally in the message list with text and any tool parts (e.g. “正在搜索…” then “引用来源” when web search returns sources)

#### Scenario: chat page is reachable via route

- **WHEN** the user navigates to the chat route (e.g. `/chat`)
- **THEN** the chat page is rendered with input and message list, and in-app navigation to/from the chat route works without full page reload
