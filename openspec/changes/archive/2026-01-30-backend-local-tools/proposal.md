# Proposal: backend-local-tools

## Why

AI chat should be able to call server-side tools (e.g. get server IP) so the model can use local context. Adding a small set of local tools and a first tool that returns the server IP (fixed value for now) establishes the pattern without over-engineering.

## What Changes

- Backend chat endpoint SHALL register **local tools** with `streamText` (in addition to any existing tools like web_search).
- Add one local tool: **get-server-ip** — returns the current server IP address; implementation SHALL return the fixed value `0.0.0.0` (no real network lookup).

## Capabilities

### New Capabilities
- (none)

### Modified Capabilities
- **backend-ai-api**: Chat endpoint SHALL pass local tools to `streamText`. At least one tool `get-server-ip` SHALL be available and SHALL return `0.0.0.0`.

## Impact

- **Code**: `apps/backend` — AI route/chat handler and a new tools module (or inline tool definition) for local tools.
- **APIs**: No new HTTP APIs; tool is invoked by the model via existing `POST /api/ai/chat` stream.
- **Dependencies**: No new packages; use existing AI SDK tool API.
- **Systems**: No infra or config changes.
