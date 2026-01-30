## 1. Backend: Chat SSE streaming

- [x] 1.1 In `src/ai/chat.ts`: add streaming API (e.g. `streamChat`) using ai-sdk `streamText`; keep env/config and `ChatMessage` type; keep existing `chat` or remove if unused
- [x] 1.2 In `src/routes/ai.ts`: change `POST /api/ai/chat` to return `Content-Type: text/event-stream`, pipe stream from `streamText` into SSE events (e.g. `data: {...}`); on config/upstream error return JSON error (503/400) with unified fail format

## 2. Frontend: Chat page and SSE client

- [x] 2.1 Add route `/chat` and a chat page component (e.g. under `pages/chat.tsx` or `pages/Chat.tsx`); ensure in-app navigation to/from `/chat` works
- [x] 2.2 Implement SSE client: `fetch` to `POST /api/ai/chat` with `messages` body, consume response as `ReadableStream`, parse SSE `data:` lines and expose incremental content (e.g. callback or state updates)
- [x] 2.3 Chat page UI: message list (user + assistant messages), input + send (e.g. Enter or button); render assistant reply incrementally as streamed chunks arrive
- [x] 2.4 Wire chat page to backend: use env API base URL for chat endpoint; handle stream errors (e.g. show error message in UI)
