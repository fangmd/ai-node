## Why

Users need the ability to delete chat sessions to manage their conversation history and clean up unwanted sessions. Currently, sessions can only be created and listed, but there is no way to remove them. This change adds session deletion functionality to both the backend API and frontend UI.

## What Changes

- **Backend API**: Add `DELETE /api/ai/sessions` endpoint that accepts a JSON body with `sessionIds` (string array) for batch deletion. The endpoint requires authentication and verifies session ownership for all sessions.
- **Backend Repository**: Add `deleteSessions` function for batch deletion that accepts an array of session ids and user_id (with ownership verification for all sessions)
- **Message Cleanup**: When a session is deleted, associated messages should also be deleted (cascade deletion at application level, since there are no database foreign keys)
- **Frontend API Client**: Add `deleteSessions(sessionIds: string[])` function for batch deletion
- **Frontend UI**: Add batch selection UI (e.g., checkboxes) and batch delete action to allow users to select and delete multiple sessions at once
- **Frontend State Management**: Update zustand session store to:
  - Add `removeSessions(sessionIds: string[])` action for batch deletion
  - Handle current session deletion (clear currentSessionId if the deleted sessions include the active session)

## Capabilities

### New Capabilities
<!-- Capabilities being introduced. Replace <name> with kebab-case identifier (e.g., user-auth, data-export, api-rate-limiting). Each creates specs/<name>/spec.md -->
- None (this change modifies existing capabilities)

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->
- `backend-ai-api`: Add requirement for DELETE endpoint to delete sessions in batch
- `session-list-ui`: Add requirements for batch selection UI and state management for handling batch deleted sessions

## Impact

- **Backend**: 
  - `apps/backend/src/routes/ai.ts`: Add DELETE route handler for batch deletion
  - `apps/backend/src/repositories/session.repository.ts`: Add `deleteSessions` function
  - `apps/backend/src/repositories/message.repository.ts`: May need `deleteMessagesBySessionIds` function for cascade deletion
- **Frontend**:
  - `apps/frontend/src/api/sessions.ts`: Add `deleteSessions` API client function
  - `apps/frontend/src/stores/session.ts`: Add `removeSessions` action to zustand store
  - `apps/frontend/src/components/chat/session-list.tsx`: Add batch selection UI (checkboxes, batch delete button)
- **Database**: No schema changes required (deletion uses existing Prisma delete operations)
