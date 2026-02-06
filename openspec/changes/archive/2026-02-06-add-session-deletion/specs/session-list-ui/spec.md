## ADDED Requirements

### Requirement: Batch session selection UI

The frontend SHALL provide batch selection UI for sessions in the session list. Each session list item SHALL have a checkbox that allows users to select multiple sessions. The frontend SHALL display a batch delete button when one or more sessions are selected. The batch delete button SHALL be disabled when no sessions are selected.

#### Scenario: checkboxes appear on session items
- **WHEN** the user views the session list
- **THEN** each session item SHALL display a checkbox that allows selecting that session for batch operations

#### Scenario: batch delete button appears when sessions selected
- **WHEN** the user selects one or more sessions via checkboxes
- **THEN** a batch delete button SHALL appear or become enabled in the session list UI

#### Scenario: batch delete button disabled when no selection
- **WHEN** no sessions are selected (all checkboxes unchecked)
- **THEN** the batch delete button SHALL be disabled or hidden

### Requirement: Batch session deletion

The frontend SHALL allow users to delete multiple selected sessions at once. When the user clicks the batch delete button, the frontend SHALL call `DELETE /api/ai/sessions` with the selected session IDs. After successful deletion, the frontend SHALL remove the deleted sessions from the zustand store and SHALL clear the current session ID if it was among the deleted sessions.

#### Scenario: batch delete calls API with selected IDs
- **WHEN** the user selects multiple sessions (e.g., sessions with ids "id1" and "id2") and clicks the batch delete button
- **THEN** the frontend SHALL send `DELETE /api/ai/sessions` with body `{ "sessionIds": ["id1", "id2"] }`

#### Scenario: batch delete removes sessions from store
- **WHEN** the batch delete API call succeeds
- **THEN** the frontend SHALL remove the deleted session IDs from the zustand sessionList and SHALL update the UI to reflect the removal

#### Scenario: batch delete clears current session if deleted
- **WHEN** the user deletes sessions via batch delete and the currentSessionId matches one of the deleted session IDs
- **THEN** the frontend SHALL set currentSessionId to null and SHALL clear the chat view

#### Scenario: batch delete handles errors
- **WHEN** the batch delete API call fails (e.g., network error or server error)
- **THEN** the frontend SHALL display an error message to the user and SHALL NOT update the session list or currentSessionId
