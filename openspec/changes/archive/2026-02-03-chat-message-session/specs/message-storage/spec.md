# message-storage

## Purpose

Backend persistence of chat sessions and messages: Session and Message tables (logical association, no FKs), Snowflake BigInt ids; messages stored with AI SDK–aligned shape (role, parts); user message created on receive, assistant message created at stream start and updated when stream ends.

## ADDED Requirements

### Requirement: Session and Message data model

The backend SHALL persist sessions and messages in a Session table and a Message table. Tables SHALL use logical association only (no database foreign keys). Session SHALL have: id (BigInt, Snowflake primary key), user_id (BigInt, logical association to User), title (optional string), create_time, update_time. Message SHALL have: id (BigInt, Snowflake primary key), session_id (BigInt, logical association to Session), role (user | assistant | system), parts (JSON, AI SDK parts structure), create_time, update_time. Ids SHALL be generated using the project's `common/snowflake` `generateUUID()`.

#### Scenario: Session and Message tables exist

- **WHEN** the backend schema is applied (e.g. Prisma migrate)
- **THEN** Session and Message models SHALL exist with the described fields and no foreign key relations

#### Scenario: message id is Snowflake BigInt

- **WHEN** a message is created
- **THEN** its id SHALL be a BigInt from Snowflake; when returned to the client (e.g. in API responses), the id MAY be serialized as string for UIMessage compatibility

### Requirement: Session created on first user message

The backend SHALL create a Session only when the first user message is received for a new conversation (i.e. when `POST /api/ai/chat` is called without sessionId). The Session SHALL be created before persisting the first user message; the new session's id SHALL be returned to the client (e.g. in stream metadata or first chunk) so the frontend can set currentSessionId.

#### Scenario: no session id creates new session

- **WHEN** a client sends `POST /api/ai/chat` with valid messages and no sessionId
- **THEN** the backend SHALL create a new Session for the authenticated user, then persist the user message(s) and run the chat stream; the new sessionId SHALL be provided to the client as specified by the API contract

#### Scenario: session ownership enforced

- **WHEN** a client sends `POST /api/ai/chat` with a sessionId
- **THEN** the backend SHALL verify that the Session exists and that its user_id matches the authenticated user; if not, the backend SHALL respond with an error (e.g. 403 or 404)

### Requirement: User message persisted before stream

The backend SHALL persist each user message as a Message row before invoking the stream (e.g. before `streamText`). The message SHALL have role "user" and the final parts from the request. No update SHALL be required after insert.

#### Scenario: user message stored before stream

- **WHEN** a client sends a user message in `POST /api/ai/chat` (with or without sessionId)
- **THEN** the backend SHALL insert a Message record with role user and the given parts, then proceed with the chat stream

### Requirement: Assistant message created at stream start and updated when stream ends

The backend SHALL create an assistant Message row when the stream starts (e.g. when the first chunk is sent or when streamText is invoked), with role "assistant" and parts optionally empty or placeholder. When the stream ends, the backend SHALL update that same Message row with the final parts (full text and tool results).

#### Scenario: assistant message row created at stream start

- **WHEN** the backend starts streaming the assistant reply
- **THEN** an assistant Message row SHALL be created for the current session with the same session_id as the user message(s), with id from Snowflake; parts MAY be empty or placeholder initially

#### Scenario: assistant message updated when stream ends

- **WHEN** the stream completes successfully
- **THEN** the backend SHALL update the assistant Message row with the final parts (complete text and tool-call/tool-result parts) so that history and reload show the full reply

### Requirement: List sessions and get session messages

The backend SHALL provide an endpoint to list the current user's sessions (e.g. `GET /api/ai/sessions`) and an endpoint to get messages for a session (e.g. `GET /api/ai/sessions/:sessionId/messages`). List SHALL be filtered by authenticated user (user_id); messages SHALL be filtered by session_id and SHALL be returned in order (e.g. by create_time or id ascending). Session ownership SHALL be enforced: only the session's user may list or read its messages.

#### Scenario: list sessions returns user sessions only

- **WHEN** a client sends `GET /api/ai/sessions` with valid JWT
- **THEN** the response SHALL contain only sessions whose user_id matches the authenticated user, ordered (e.g. by update_time descending)

#### Scenario: get session messages returns ordered UIMessage-shaped list

- **WHEN** a client sends `GET /api/ai/sessions/:sessionId/messages` with valid JWT and the session belongs to the user
- **THEN** the response SHALL contain messages for that session in order (e.g. create_time ascending), each with id (string), role, and parts compatible with AI SDK UIMessage

#### Scenario: get session messages rejects wrong user

- **WHEN** a client sends `GET /api/ai/sessions/:sessionId/messages` and the session exists but user_id does not match the authenticated user
- **THEN** the backend SHALL respond with an error (e.g. 403 or 404)
