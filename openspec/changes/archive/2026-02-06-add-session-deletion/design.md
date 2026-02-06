## Context

The application currently supports creating and listing chat sessions, but lacks deletion functionality. Sessions are stored in a `Session` table with Snowflake BigInt IDs, and messages are stored in a `Message` table with a logical association to sessions (no database foreign keys). The backend uses Prisma ORM with MySQL, and the frontend uses zustand for state management.

Existing patterns in the codebase:
- LLM config deletion (`DELETE /api/settings/llm/configs/:id`) uses `deleteMany` with user_id verification
- Session operations use `updateMany` with user_id verification for ownership checks
- No cascade deletion exists yet, but the pattern is clear: verify ownership, then delete related records

## Goals / Non-Goals

**Goals:**
- Enable users to delete multiple sessions at once via batch deletion API
- Ensure atomic deletion of sessions and their associated messages
- Verify session ownership before deletion to prevent unauthorized access
- Update frontend UI to support batch selection and deletion
- Handle edge cases (deleting active session, empty selection, etc.)

**Non-Goals:**
- Single session deletion endpoint (only batch deletion)
- Soft delete or archive functionality (hard delete only)
- Undo/restore deleted sessions
- Deletion confirmation dialogs (handled by frontend implementation)

## Decisions

### 1. Batch deletion via DELETE with body payload

**Decision**: Use `DELETE /api/ai/sessions` with JSON body `{ sessionIds: string[] }` instead of path parameters.

**Rationale**: 
- Supports variable number of session IDs in a single request
- Consistent with RESTful patterns (DELETE for deletion)
- Easier to extend in the future if needed (e.g., add filters or conditions)

**Alternatives considered**:
- `POST /api/ai/sessions/delete` - Less RESTful, but some prefer POST for complex operations
- `DELETE /api/ai/sessions?ids=id1,id2` - Query parameters are less flexible and have length limits

### 2. Transaction-based cascade deletion

**Decision**: Use Prisma transaction to atomically delete sessions and their messages.

**Rationale**:
- Ensures data consistency: either all deletions succeed or none do
- Prevents orphaned messages if session deletion fails partway through
- Matches existing pattern in `deleteLlmConfig` which uses transactions

**Implementation**: 
```typescript
prisma.$transaction(async (tx) => {
  // Delete messages first (child records)
  await tx.message.deleteMany({ where: { session_id: { in: sessionIds } } });
  // Then delete sessions (parent records)
  return tx.session.deleteMany({ where: { id: { in: sessionIds }, user_id: userId } });
});
```

### 3. Ownership verification before deletion

**Decision**: Verify all session IDs belong to the authenticated user before deletion.

**Rationale**:
- Prevents unauthorized deletion of other users' sessions
- Fails fast if any session doesn't belong to user (all-or-nothing)
- Consistent with existing `findSessionByIdAndUserId` pattern

**Implementation**: Query sessions first to verify ownership, then proceed with deletion if all belong to user.

### 4. Frontend batch selection with checkboxes

**Decision**: Add checkboxes to session list items for batch selection, with a batch delete button.

**Rationale**:
- Standard UI pattern for batch operations
- Allows users to select multiple sessions before confirming deletion
- Can reuse existing session list component structure

**Alternatives considered**:
- Multi-select with Shift+Click - Less discoverable, harder on mobile
- Select all checkbox - Good addition but not required for MVP

## Risks / Trade-offs

**[Risk] Partial batch deletion failure** → Mitigation: Use transaction to ensure atomicity. If any session fails verification or deletion, entire operation rolls back.

**[Risk] Performance with large batch sizes** → Mitigation: Consider adding reasonable limit (e.g., max 100 sessions per batch). For now, rely on natural limits (users typically won't select hundreds).

**[Risk] Deleting active session** → Mitigation: Frontend state management clears `currentSessionId` if deleted sessions include active one. Backend doesn't need special handling.

**[Risk] Empty sessionIds array** → Mitigation: Validate request body, return 400 BadRequest if empty array.

**[Trade-off] No individual delete button** → Users must select at least one session to delete. This simplifies API but may feel less convenient for single deletions. Acceptable trade-off for MVP.
