# backend-ai-api

## Purpose

AI API route group under `/api/ai`: Hono sub-app mount and initial hello endpoint; future AI endpoints (chat, completions, etc.) live under this group.

## ADDED Requirements

### Requirement: AI route group

The backend SHALL expose an AI API route group at path prefix `/api/ai`. All AI-related endpoints SHALL be mounted under this prefix via a Hono sub-app (e.g. `app.route('/api/ai', ai)`).

#### Scenario: AI group mounted

- **WHEN** the backend is running
- **THEN** requests to paths under `/api/ai/*` are handled by the AI route group

### Requirement: AI hello endpoint

The backend SHALL provide `GET /api/ai/hello` that returns a success response using the existing unified response format (code 200, msg "success", data).

#### Scenario: hello returns success

- **WHEN** a client sends `GET /api/ai/hello`
- **THEN** the response body is `{ "code": 200, "msg": "success", "data": <object> }` and HTTP status is 200
