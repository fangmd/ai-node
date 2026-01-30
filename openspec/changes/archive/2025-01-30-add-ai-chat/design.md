# Design: Add AI Chat

## Context

- Backend 使用 Hono，已有 `/api/ai` 路由组（`apps/backend/src/routes/ai.ts`），当前仅提供 `GET /api/ai/hello`。
- 统一响应格式为 `{ code, msg, data }`，由 `response.ts` 的 `success`/`fail` 提供。
- 本次在既有 AI 路由组下增加聊天接口，使用 ai-sdk 调用 OpenAI 兼容端点，配置通过环境变量注入，不硬编码密钥。

## Goals / Non-Goals

**Goals:**

- 提供 `POST /api/ai/chat`，请求体为消息列表，响应为统一格式，内部使用 ai-sdk 调用 LLM。
- 通过环境变量 `OPENAI_BASE_URL`、`OPENAI_API_KEY` 配置上游，缺省时返回明确错误（如 503 或 400）。
- 错误与超时统一走 `fail`，保持与现有 API 一致。

**Non-Goals:**

- 本阶段不实现流式响应（SSE）；可后续在同端点或新端点扩展。
- 不实现对话历史持久化、多轮会话 ID 等；请求即单次对话。

## Decisions

- **使用 ai-sdk**：采用 Vercel AI SDK（`ai` + `@ai-sdk/openai`），与 Hono 集成简单，类型友好。*Alternatives*：直接调 OpenAI HTTP API——未采纳，因 ai-sdk 封装了模型调用与错误，代码更简洁。
- **非流式优先**：首版仅实现非流式：请求体 → 一次完整回复 → `data` 中返回 assistant 消息内容。流式留作后续迭代。
- **配置必须来自 env**：`OPENAI_BASE_URL`、`OPENAI_API_KEY` 从 `process.env` 读取；任一缺失时返回 503（或 400）并提示配置缺失，不 fallback 默认值。
- **路由与封装**：在 `apps/backend/src/routes/ai.ts` 中新增 `POST /chat`；LLM 调用封装在单独模块（如 `src/ai/chat.ts` 或同目录下 `chat.ts`），便于复用与测试。

## Risks / Trade-offs

- **[Risk] 上游不可用或超时** → 使用 ai-sdk 的 timeout 配置，捕获错误后通过 `fail` 返回统一格式，避免泄露内部堆栈。
- **[Risk] API Key 泄露** → 仅从 env 读取，文档与 `.env.example` 中不包含真实密钥；部署时由运维配置。
- **Trade-off**：非流式首版体验不如流式，但实现与联调更简单，先上线再迭代流式。

## Migration Plan

1. 在 backend 增加依赖：`ai`、`@ai-sdk/openai`。
2. 在 `apps/backend` 根目录或文档中说明需配置 `OPENAI_BASE_URL`、`OPENAI_API_KEY`；更新 `.env.example` 增加两项（值为占位，如 `OPENAI_BASE_URL=`、`OPENAI_API_KEY=`）。
3. 实现 chat 模块与 `POST /api/ai/chat` 路由，本地/CI 验证通过后合并。
4. 若有回滚：移除 chat 路由与 ai 调用模块，保留 hello；依赖可保留或移除，按需决定。

## Open Questions

- 无；流式与多轮会话留待后续 change 再定。
