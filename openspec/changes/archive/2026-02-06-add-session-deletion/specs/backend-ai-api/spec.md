## ADDED Requirements

### Requirement: Batch session deletion endpoint

The backend SHALL provide `DELETE /api/ai/sessions` that accepts a JSON body with `sessionIds` (string array, Session Snowflake ids). The endpoint SHALL require a valid JWT (via `jwtAuth` middleware) and SHALL verify that all sessions in the array belong to the authenticated user (user_id match). The endpoint SHALL delete the specified sessions and their associated messages atomically (in a transaction). If any session does not exist or belongs to a different user, the backend SHALL respond with an error (e.g. 403 or 404) and SHALL NOT delete any sessions.

#### Scenario: batch delete deletes multiple sessions
- **WHEN** a client sends `DELETE /api/ai/sessions` with valid JWT and body `{ "sessionIds": ["id1", "id2"] }` where both sessions belong to the authenticated user
- **THEN** the backend SHALL delete both sessions and all their associated messages, and SHALL return a success response (e.g. `{ "code": 200, "msg": "success", "data": { "deleted": true } }`)

#### Scenario: batch delete verifies ownership
- **WHEN** a client sends `DELETE /api/ai/sessions` with valid JWT and body `{ "sessionIds": ["id1", "id2"] }` where id1 belongs to the user but id2 belongs to a different user
- **THEN** the backend SHALL respond with an error (e.g. 403 or 404) and SHALL NOT delete any sessions

#### Scenario: batch delete deletes associated messages
- **WHEN** a client sends `DELETE /api/ai/sessions` with valid JWT and body `{ "sessionIds": ["id1"] }` where the session has associated messages
- **THEN** the backend SHALL delete the session and all messages associated with that session in a single transaction

#### Scenario: batch delete rejects empty array
- **WHEN** a client sends `DELETE /api/ai/sessions` with valid JWT and body `{ "sessionIds": [] }`
- **THEN** the backend SHALL respond with an error (e.g. 400 BadRequest) indicating that at least one session ID is required

#### Scenario: batch delete requires authentication
- **WHEN** a client sends `DELETE /api/ai/sessions` without `Authorization` header or with an invalid/expired token
- **THEN** the backend SHALL respond with HTTP 401 and a JSON body in the unified error format (e.g. code 401, msg indicating unauthorized)
