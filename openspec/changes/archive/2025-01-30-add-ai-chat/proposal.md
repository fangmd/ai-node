# Proposal: Add AI Chat

## Why

需要提供 AI 对话能力，让前端或客户端能通过后端与 LLM 进行聊天。现有 `backend-ai-api` 仅有 hello 占位接口，本次在既有路由组下增加真实可用的聊天接口，并统一通过环境变量配置上游（OpenAI 兼容）地址与密钥，便于部署与安全管控。

## What Changes

- 在 `/api/ai` 下新增聊天接口（如 `POST /api/ai/chat`），请求体包含消息列表，响应使用现有统一响应格式（code/msg/data）。
- 后端使用 **ai-sdk** 调用 LLM，支持流式与非流式（具体形态在 design 中定）。
- AI 上游配置通过环境变量注入：`OPENAI_BASE_URL`、`OPENAI_API_KEY`，不在代码中硬编码密钥。
- 保持现有 `GET /api/ai/hello` 行为不变。

## Capabilities

### New Capabilities

无。聊天能力归属现有 AI API 能力范畴。

### Modified Capabilities

- **backend-ai-api**：新增聊天接口的契约（路径、请求/响应格式、错误处理）及“必须通过环境变量配置 base URL 与 API Key”的配置要求；在 delta spec 中描述新增/变更的 requirements。

## Impact

- **代码**：backend 的 AI 路由模块（如 `apps/api` 内 ai 相关路由与 handler），新增对 ai-sdk 的调用与封装。
- **依赖**：backend 增加 `ai-sdk`（及所需 OpenAI provider）依赖。
- **配置**：需在运行环境中配置 `OPENAI_BASE_URL`、`OPENAI_API_KEY`；文档与示例（如 `.env.example`）需更新。
- **系统**：后端会向配置的 OpenAI 兼容端点发起 HTTP 请求，需保证网络可达与密钥有效。
