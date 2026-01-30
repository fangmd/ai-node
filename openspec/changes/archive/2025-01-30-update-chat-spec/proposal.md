# Proposal: Update specs to reflect current chat implementation

## Why

The chat feature has been extended with web search and a UI message stream: the backend accepts UIMessage format, returns a UI message stream (including tool calls and results), and the frontend uses `useChat` with message parts (text + tool invocations). The existing specs (backend-ai-api, frontend-app) still describe the earlier contract (simple `role`/`content` messages and plain text SSE). Updating the specs to match the current implementation keeps the spec the single source of truth and makes future changes and verification easier.

## What Changes

- **Backend chat contract**
  - `POST /api/ai/chat` request body: `messages` array is **UIMessage[]** (AI SDK UI message format with `id`, `role`, `parts`), not a simple `{ role, content }[]`.
  - Response: stream is **UI message stream** (e.g. `toUIMessageStreamResponse`), not plain text SSE. It carries text deltas, tool-call and tool-result parts, and supports `originalMessages` for client-side message matching.
  - Chat pipeline uses **convertToModelMessages** to turn UIMessages into model messages and **streamText** with a **web_search** tool (OpenAI provider `webSearch`). Model is OpenAI Responses API (e.g. gpt-5.2).
- **Frontend chat UI**
  - Chat page uses **useChat** from `@ai-sdk/react` with **DefaultChatTransport** pointing at the chat API. Input state is managed locally (e.g. `useState`); submission via **sendMessage**.
  - Messages are rendered from **message.parts**: text parts as streamed text; **tool-web_search** parts show “正在搜索…” while the tool is running and “引用来源” (citation links) when `output.sources` is available.
  - Status (e.g. submitted/streaming) is shown (e.g. “等待回复…” / “正在输入…”); errors from the hook are displayed.
- **BREAKING**: Clients that send the old body shape `{ "messages": [ { "role": "user", "content": "..." } ] }` are no longer compatible; the backend expects UIMessage[] (with `parts`). The frontend is the only consumer and already uses useChat, so this is an intentional spec update to match implementation.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- **backend-ai-api**: Chat endpoint SHALL accept request body `{ messages: UIMessage[] }`; SHALL convert UIMessages to model messages and call streamText with a web_search tool; SHALL respond with a UI message stream (e.g. `toUIMessageStreamResponse` with `originalMessages`). Existing requirements (route group, hello, env config, error when config missing) unchanged.
- **frontend-app**: Chat page SHALL use useChat with DefaultChatTransport; SHALL render assistant messages from `message.parts` (text and tool parts); SHALL display tool-web_search state (“正在搜索…” while searching, “引用来源” with links when sources exist); SHALL show stream/status and errors. Other frontend requirements unchanged.

## Impact

- **Code**: `apps/backend/src/ai/chat.ts` (streamChatFromUIMessages, convertToModelMessages, tools including web_search), `apps/backend/src/routes/ai.ts` (UIMessage body, toUIMessageStreamResponse); `apps/frontend/src/pages/chat.tsx` (useChat, MessageParts, tool-web_search UI).
- **APIs**: `POST /api/ai/chat` request/response format as above.
- **Dependencies**: Backend already uses `ai` (convertToModelMessages, UIMessage, streamText, toUIMessageStreamResponse); frontend uses `@ai-sdk/react` (useChat) and `ai` (DefaultChatTransport).
- **Systems**: No other systems affected; chat remains a single backend + frontend flow.
