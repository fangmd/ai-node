## Context

- **Backend**: Hono app with AI route group at `/api/ai`; chat handler uses `generateText` from ai-sdk and returns a single JSON body via unified response (`success(c, { content: text })`).
- **Frontend**: React SPA with Vite, React Router, Tailwind; has home and about pages, no chat UI.
- **Constraint**: OpenAI config remains env-only; no new auth or persistence in this change.

## Goals / Non-Goals

**Goals:**

- Backend chat endpoint streams assistant reply via SSE (`text/event-stream`).
- Frontend has a chat page with input and message list; consumes SSE and renders streamed content incrementally.

**Non-Goals:**

- Backward compatibility for old JSON chat response.
- Chat history persistence, multi-turn persistence across sessions, or auth.
- Supporting non-SSE clients (e.g. keep a second JSON endpoint).

## Decisions

1. **SSE transport**
   - Use HTTP SSE (`Content-Type: text/event-stream`) for streaming. Rationale: simple, widely supported, unidirectional; fits “server pushes chunks” model. Alternatives: WebSocket (overkill for one-way stream), chunked transfer without SSE (less standard for event parsing).
   - Backend will use ai-sdk `streamText` and pipe the resulting stream into SSE events (e.g. `data: { "content": "..." }` or text deltas). Exact event shape is implementation detail but must allow incremental display on the client.

2. **Error handling**
   - Config or upstream errors (e.g. missing env, LLM failure) return a normal JSON error response (e.g. 503/400 with unified fail format), not an SSE stream. Rationale: client can distinguish “no stream” + JSON body as error vs “stream started” as success path.

3. **Frontend SSE consumption**
   - Use `fetch` + `ReadableStream` (or `getReader()`) to consume the SSE response and parse `data:` lines. Rationale: keeps one HTTP request, no extra EventSource if we already need POST body for `messages`. Alternative: EventSource is GET-only, so not suitable for POST /api/ai/chat.

4. **Chat page placement**
   - Add a route (e.g. `/chat`) and a dedicated chat page component; reuse existing layout/navigation if present. Message list and input live in that page (or subcomponents). No global chat state beyond the page for now.

## Risks / Trade-offs

- **[Risk]** Clients that currently call `POST /api/ai/chat` and expect JSON will break. → **Mitigation**: Treat as breaking change; document and coordinate with any existing consumers (e.g. update frontend only in same release).
- **[Risk]** Long-lived SSE connections may hit timeouts or proxy limits. → **Mitigation**: Keep streams to single reply; no long-lived idle connection. If needed later, add timeouts or heartbeat.
- **[Trade-off]** No fallback JSON endpoint: simpler backend, but no compatibility. Accepted for this change.

## Migration Plan

1. Implement backend: switch chat handler to `streamText`, set `Content-Type: text/event-stream`, emit SSE chunks; keep error responses as JSON.
2. Implement frontend: add `/chat` route and page, implement POST + SSE consumption and incremental render.
3. Deploy backend and frontend together (or backend first, then frontend) so that the only consumer (new chat UI) uses SSE. No rollback of old JSON contract needed if no other consumers.

## Open Questions

- Event payload shape (e.g. `{ "content": "..." }` vs plain text lines) can be fixed in implementation; align backend and frontend in the same change.
