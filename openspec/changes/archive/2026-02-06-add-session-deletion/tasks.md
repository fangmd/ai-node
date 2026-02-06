## 1. Backend Repository Functions

- [x] 1.1 Add `deleteMessagesBySessionIds` function to `apps/backend/src/repositories/message.repository.ts` that deletes messages for multiple session IDs
- [x] 1.2 Add `deleteSessions` function to `apps/backend/src/repositories/session.repository.ts` that accepts array of session IDs and user_id, verifies ownership, and deletes sessions and messages in a transaction

## 2. Backend API Endpoint

- [x] 2.1 Add `DELETE /api/ai/sessions` route handler to `apps/backend/src/routes/ai.ts` that accepts JSON body with `sessionIds` array
- [x] 2.2 Implement request body validation (require non-empty sessionIds array)
- [x] 2.3 Implement ownership verification (verify all session IDs belong to authenticated user)
- [x] 2.4 Call `deleteSessions` repository function and return success response
- [x] 2.5 Handle error cases (empty array, unauthorized sessions, etc.) with appropriate error responses

## 3. Frontend API Client

- [x] 3.1 Add `deleteSessions(sessionIds: string[])` function to `apps/frontend/src/api/sessions.ts` that calls `DELETE /api/ai/sessions` with sessionIds array

## 4. Frontend State Management

- [x] 4.1 Add `removeSessions(sessionIds: string[])` action to zustand store in `apps/frontend/src/stores/session.ts`
- [x] 4.2 Implement logic to remove deleted session IDs from sessionList array
- [x] 4.3 Implement logic to clear currentSessionId if it's in the deleted sessions array

## 5. Frontend UI Components

- [x] 5.1 Add checkbox to each session item in `apps/frontend/src/components/chat/session-list.tsx` for batch selection
- [x] 5.2 Add state management for selected session IDs (track which checkboxes are checked)
- [x] 5.3 Add batch delete button that appears/enables when sessions are selected
- [x] 5.4 Implement batch delete handler that calls `deleteSessions` API and updates store
- [x] 5.5 Add error handling and user feedback for batch delete operations
- [x] 5.6 Handle edge case: disable batch delete button when no sessions are selected
