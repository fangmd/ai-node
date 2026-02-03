# Chat Message Session – Proposal

## Why

用户需要多会话管理与消息持久化：在多个对话之间切换、保留历史记录，并在刷新后恢复。当前聊天仅支持单次请求内的消息，无会话概念且消息不落库。

## What Changes

- 前端：增加**会话列表 UI**（侧边或独立区域），展示当前用户的会话列表；支持**新建会话**入口，会话在用户发送**第一条消息后**再创建；引入 **zustand**（`^5.0.9`）做状态管理（会话列表、当前会话等）。
- 后端：引入**会话**与**消息**的持久化；消息表结构参考 AI SDK 的 UIMessage/消息类型，**消息 ID 由项目自行生成并维护**；聊天 API 支持按会话读写（如请求体带 `sessionId`，首条消息时创建会话并写库）。
- 现有 `POST /api/ai/chat` 行为扩展：接受可选的 `sessionId`，有则在该会话下追加并持久化消息，无则首条消息时创建新会话再写入。

## Capabilities

### New Capabilities

- **session-list-ui**: 前端会话列表与新建会话入口；使用 zustand（^5.0.9）管理会话列表与当前会话状态；列表展示当前用户会话，选中切换会话并加载其消息；新建会话在发送第一条消息后创建对应会话。
- **message-storage**: 后端会话与消息的存储；消息表参考 AI SDK 消息形态（如 role、parts 等），消息 ID 由项目生成并维护；聊天流式响应前后将消息写入数据库，支持按会话加载历史。

### Modified Capabilities

- **backend-ai-api**: Chat 端点需支持可选 `sessionId`；首条消息时创建会话并落库，后续请求在已有会话下追加并持久化消息；响应仍为 UI message stream，与现有客户端兼容。

## Impact

- **前端**：`apps/frontend` 聊天页（如 `chat.tsx`）需增加会话列表、当前会话状态、新建会话与切换会话逻辑；使用 zustand store 管理会话列表与当前会话；与 `useChat` / AI SDK 的集成方式可能需配合 `id`、`body` 等传 sessionId。
- **后端**：`apps/backend` 的 AI 路由（如 `routes/ai.ts`）、聊天逻辑（如 `ai/chat.ts`）需接入会话与消息的创建/查询；需新增或扩展 Prisma 模型（Session、Message 等）及迁移。
- **依赖**：继续使用现有 AI SDK（streamText、UIMessage、toUIMessageStreamResponse）；前端新增 **zustand** `^5.0.9` 做状态管理。
- **数据库**：需新增会话表与消息表（或等效 schema），并运行迁移。
