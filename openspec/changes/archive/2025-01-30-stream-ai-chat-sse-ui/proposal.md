## Why

The current AI chat endpoint returns the full assistant reply in one JSON response. Streaming the reply over SSE improves perceived responsiveness and matches common chat UX. The frontend currently has no UI to call the chat API; adding a chat interface lets users interact with the AI from the app.

## What Changes

- **Backend**: Change `POST /api/ai/chat` from returning a single JSON body to streaming the assistant reply via HTTP Server-Sent Events (SSE). Request body (e.g. `messages`) remains; response becomes an SSE stream. **BREAKING** for clients that expect a single JSON response.
- **Frontend**: Add a chat page (or view) with an input and message list, calling the backend chat API via SSE and rendering streamed content as it arrives.

## Capabilities

### New Capabilities

- _(None. All changes are modifications to existing capabilities.)_

### Modified Capabilities

- **backend-ai-api**: Chat endpoint requirement changes from "return assistant reply in unified JSON" to "stream assistant reply via SSE (unified envelope or equivalent for stream chunks)".
- **frontend-app**: Add a requirement for a chat UI that allows sending messages and displaying streamed assistant replies, using the backend chat SSE endpoint.

## Impact

- **Backend**: `apps/backend` — AI route group and chat handler (e.g. `src/routes/ai.ts`, `src/ai/chat.ts`); response format and possibly ai-sdk usage (streamText vs generateText).
- **Frontend**: `apps/frontend` — New route/page and components for chat; SSE client (fetch + EventSource or ReadableStream); state for messages and streamed content.
- **API contract**: Clients of `POST /api/ai/chat` must switch to consuming SSE; no backward compatibility for the old JSON response.
