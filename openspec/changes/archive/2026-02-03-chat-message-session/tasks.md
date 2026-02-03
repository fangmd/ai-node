## 1. Database

- [x] 1.1 Add Session and Message models to Prisma schema (BigInt ids, user_id/session_id logical association, no FKs)
- [x] 1.2 Run Prisma migrate for Session and Message tables

## 2. Backend – Sessions and messages

- [x] 2.1 Implement session create/read (Snowflake id via common/snowflake, filter by user_id)
- [x] 2.2 Implement message create/read (Snowflake id, filter by session_id; user message insert before stream, assistant insert at stream start + update when stream ends)
- [x] 2.3 Add GET /api/ai/sessions (JWT, return current user sessions ordered by update_time desc)
- [x] 2.4 Add GET /api/ai/sessions/:sessionId/messages (JWT, verify session ownership, return UIMessage-shaped list ordered by create_time)

## 3. Backend – Chat integration

- [x] 3.1 Accept optional sessionId in POST /api/ai/chat body; validate session ownership when present
- [x] 3.2 When no sessionId: create Session on first user message, persist user message(s), then stream; create assistant Message at stream start, update with final parts when stream ends; return new sessionId to client (e.g. stream metadata or first chunk)
- [x] 3.3 When sessionId present: persist user message(s) to session, stream, create/update assistant Message as above

## 4. Frontend – State and API

- [x] 4.1 Add zustand ^5.0.9 to frontend; create session store (sessionList, currentSessionId, actions: setCurrentSession, setSessionList, addSession, clearCurrent)
- [x] 4.2 Fetch session list (GET /api/ai/sessions) and populate store; fetch session messages (GET /api/ai/sessions/:id/messages) when switching session
- [x] 4.3 Pass sessionId in useChat body (currentSessionId when set); handle new sessionId from chat response and update store + currentSessionId

## 5. Frontend – UI

- [x] 5.1 Add session list UI (sidebar or dedicated area) showing session list from store; select session to set currentSessionId and load messages into chat
- [x] 5.2 Add "new session" entry; on click clear currentSessionId and chat messages (no backend call); on first send request without sessionId and sync new session from response into store
