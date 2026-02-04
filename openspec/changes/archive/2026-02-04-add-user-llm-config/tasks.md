## 1. Database & Prisma

- [x] 1.1 Add `llm_config` model (user-owned, encrypted apiKey fields) to `apps/backend/prisma/schema.prisma`
- [x] 1.2 Add `llm_config_id` (nullable) to `Session` model and create migration
- [x] 1.3 Update session/message/user repositories as needed for new fields and queries (default config lookup, session binding updates)

## 2. Backend: LLM Config Management APIs

- [x] 2.1 Implement encryption/decryption utility for `apiKey` (server-side secret, AES-GCM) and ensure logs do not leak plaintext
- [x] 2.2 Add repository for `llm_config` CRUD (scoped by user_id) and "set default" transaction logic
- [x] 2.3 Add settings routes: list/create/update/delete configs; set default; ensure access control (owner check)
- [x] 2.4 Ensure API responses never include plaintext apiKey and include `hasKey`/`isDefault` for UI

## 3. Backend: Chat/Session binding behavior

- [x] 3.1 Extend `GET /api/ai/sessions` response to include `llmConfigId` (optional)
- [x] 3.2 Update `POST /api/ai/chat` to accept optional `llmConfigId` and implement binding rules (explicit -> session bound -> user default with补齐; reject when none)
- [x] 3.3 Refactor AI provider/model creation to use user config (provider/baseURL/apiKey/modelId) instead of env global config
- [x] 3.4 Add/adjust error mapping to return clear error when user has no usable llm config (prompt to configure)

## 4. Frontend: Settings module + LLM management page

- [x] 4.1 Add settings route group (e.g. `/settings`) and navigation entry points
- [x] 4.2 Implement `/settings/llm` page UI: list configs, create/edit/delete, set default
- [x] 4.3 Implement frontend API client for LLM config endpoints (list/create/update/delete/set-default)
- [x] 4.4 Ensure apiKey input is write-only (never displayed); edit without apiKey keeps existing key unless user provides a new one

## 5. Frontend: Chat model selector bound to session

- [x] 5.1 Fetch LLM config list on chat page and render model selector above the input
- [x] 5.2 When switching sessions, restore selector to session `llmConfigId`; if empty, select user's default config
- [x] 5.3 When creating a new session (no sessionId), include `llmConfigId` in chat request body
- [x] 5.4 When changing model in an existing session, update binding by sending `sessionId + llmConfigId` in next chat request
- [x] 5.5 Add empty-state UX: if no configs, disable sending and link to `/settings/llm`

