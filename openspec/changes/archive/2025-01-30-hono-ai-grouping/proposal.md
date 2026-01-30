# Proposal: Hono AI Grouping

## Why

Introduce a dedicated API group for AI-related features so that all AI endpoints live under `/api/ai/*`, making the API structure clear and ready for future AI capabilities (e.g. chat, completions, embeddings).

## What Changes

- Add a Hono route group mounted at `/api/ai` for AI-related routes.
- Add the first AI endpoint: `GET /api/ai/hello` returning a success response, as a smoke test for the grouping.

## Capabilities

### New Capabilities
- `backend-ai-api`: AI API route group and initial hello endpoint; future AI endpoints will be added under this group.

### Modified Capabilities
- `backend-api`: No requirement changes; we add new routes under existing Hono app and reuse existing response helpers and CORS.

## Impact

- **Code**: `apps/backend/src/index.ts` — mount new AI group; optionally `apps/backend/src/routes/ai.ts` (or similar) for the AI route group and hello handler.
- **API**: New endpoint `GET /api/ai/hello`; response format follows existing unified response (code 200, msg "success", data).
- **Dependencies**: None.
