# llm-config

## Purpose

User-owned LLM configuration management: users can create, manage, and set default LLM configurations (provider, baseURL, modelId, apiKey) for use in chat sessions.

## Requirements

### Requirement: User can manage LLM configs

The system SHALL allow an authenticated user to manage their own LLM configurations. Each LLM config SHALL belong to exactly one user. An LLM config SHALL include at least: `name`, `provider`, `baseURL`, `modelId`, and `apiKey` (stored securely; see Security requirements). The system SHALL support creating, listing, updating, deleting LLM configs, and setting one config as the user's default.

#### Scenario: user creates a config
- **WHEN** an authenticated user submits a create request with valid `name`, `provider`, `baseURL`, `modelId`, and `apiKey`
- **THEN** the system creates an LLM config associated with that user and returns the new config (excluding any plaintext `apiKey`)

#### Scenario: user lists configs
- **WHEN** an authenticated user requests their LLM config list
- **THEN** the system returns only configs belonging to that user, and each item indicates whether it is the default (e.g. `isDefault`)

#### Scenario: user updates config fields without changing apiKey
- **WHEN** an authenticated user updates an existing config's `name/baseURL/modelId/provider` without providing a new `apiKey`
- **THEN** the system updates only the provided fields and keeps the stored apiKey unchanged

#### Scenario: user deletes a config
- **WHEN** an authenticated user deletes one of their configs
- **THEN** the config is removed and the user can no longer reference it for chat

### Requirement: Exactly one default config per user

The system SHALL allow a user to mark one LLM config as default. At any time, a user SHALL have at most one default LLM config. Setting a config as default SHALL clear the default flag from the user's other configs.

#### Scenario: setting default clears other defaults
- **WHEN** an authenticated user sets config A as default while config B is currently default
- **THEN** config A becomes default and config B is no longer default

### Requirement: LLM config access control

The system SHALL enforce that users can only read, modify, delete, or set-default LLM configs that they own. Attempts to access configs owned by another user SHALL be rejected.

#### Scenario: user cannot access another user's config
- **WHEN** user X attempts to update or delete an LLM config owned by user Y
- **THEN** the system rejects the request (e.g. 403 or 404) and SHALL NOT change data

### Requirement: LLM config API does not return plaintext apiKey

The system SHALL NOT return plaintext `apiKey` values in any API response. List/detail responses MAY indicate `hasKey`/`hasApiKey` as a boolean to support UI rendering.

#### Scenario: list response excludes apiKey
- **WHEN** an authenticated user lists LLM configs
- **THEN** response items do not include plaintext `apiKey` and may include `hasKey: true/false`

### Requirement: LLM config apiKey is stored securely

The system SHALL store `apiKey` values securely such that they are not persisted in plaintext. The system SHALL be able to recover the plaintext `apiKey` server-side only for the purpose of calling the upstream LLM provider.

#### Scenario: apiKey is encrypted at rest
- **WHEN** the system persists an LLM config
- **THEN** the stored representation of `apiKey` is encrypted (or equivalently protected) and is not plaintext
