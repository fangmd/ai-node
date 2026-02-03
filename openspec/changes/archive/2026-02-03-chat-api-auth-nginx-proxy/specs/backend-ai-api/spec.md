## ADDED Requirements

### Requirement: Chat endpoint authentication

The backend SHALL require a valid JWT for `POST /api/ai/chat`. The route SHALL use the existing `jwtAuth` middleware (or equivalent). Requests without a valid `Authorization: Bearer <token>` or with an invalid/expired token SHALL receive HTTP 401 with a response body in the existing unified error format (e.g. code, msg, data).

#### Scenario: chat returns 200 when authenticated

- **WHEN** a client sends `POST /api/ai/chat` with header `Authorization: Bearer <valid-jwt>` and a valid body
- **THEN** the request is processed and the response is a UI message stream with HTTP status 200 (subject to other chat requirements)

#### Scenario: chat returns 401 when not authenticated

- **WHEN** a client sends `POST /api/ai/chat` without `Authorization` or with an invalid/expired token
- **THEN** the backend SHALL respond with HTTP 401 and a JSON body in the unified error format (e.g. code 401, msg indicating unauthorized)
