## 1. 依赖与配置

- [x] 1.1 在 `apps/backend` 的 `package.json` 中增加依赖：`ai`、`@ai-sdk/openai`
- [x] 1.2 在 `apps/backend/.env.example` 中增加 `OPENAI_BASE_URL`、`OPENAI_API_KEY` 占位说明（不写真实密钥）

## 2. Chat 模块

- [x] 2.1 在 backend 中新增 chat 模块（如 `src/ai/chat.ts` 或 `src/routes/chat.ts`）：从 `process.env` 读取 `OPENAI_BASE_URL`、`OPENAI_API_KEY`，缺失时抛出或返回明确错误
- [x] 2.2 在 chat 模块中使用 ai-sdk（`@ai-sdk/openai` + `generateText`）根据 `messages` 调用 LLM，返回 assistant 文本内容；配置 `baseURL` 为 `OPENAI_BASE_URL`

## 3. 路由与响应

- [x] 3.1 在 `apps/backend/src/routes/ai.ts` 中新增 `POST /chat`：解析请求体 `{ messages }`，调用 chat 模块，成功时用 `success(c, data)` 返回助手回复，失败时用 `fail(c, code, msg)` 返回统一错误格式
- [x] 3.2 当 env 缺失导致无法调用 LLM 时，返回 503（或 400）及提示配置缺失的 msg

## 4. 验证

- [x] 4.1 本地配置 `OPENAI_BASE_URL`、`OPENAI_API_KEY` 后，请求 `POST /api/ai/chat` 且 body 含 `messages`，确认响应为 `{ code: 200, msg: "success", data: ... }`
- [x] 4.2 未设置上述 env 时请求 `POST /api/ai/chat`，确认返回错误且 msg 提示配置缺失
