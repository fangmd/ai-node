## ADDED Requirements

### Requirement: Chat UI
The frontend SHALL provide a chat page (or view) that allows the user to send messages to the backend chat API and display streamed assistant replies. The page SHALL include an input for composing messages and a message list that shows user messages and assistant replies; assistant content SHALL be rendered as it arrives from the SSE stream.

#### Scenario: user sends message and sees streamed reply
- **WHEN** the user is on the chat page, enters a message, and submits (e.g. send button or Enter)
- **THEN** the message is sent to `POST /api/ai/chat` (or the configured chat endpoint), the response is consumed as SSE, and the assistant reply appears incrementally in the message list

#### Scenario: chat page is reachable via route
- **WHEN** the user navigates to the chat route (e.g. `/chat`)
- **THEN** the chat page is rendered with input and message list, and in-app navigation to/from the chat route works without full page reload
