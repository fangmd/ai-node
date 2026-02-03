# Chat Message Session – Design

## Context

- **当前状态**：聊天为无状态。前端 `chat.tsx` 使用 `useChat` + `DefaultChatTransport` 调用 `POST /api/ai/chat`，请求体仅含 `messages`；后端 `routes/ai.ts` 校验 JWT 后直接 `streamChatFromUIMessages(messages)` 并返回 UI message stream，不落库。
- **约束**：项目已用 AI SDK（streamText、UIMessage、toUIMessageStreamResponse）；后端 Prisma + MySQL、Hono；前端需用 zustand ^5.0.9 做状态管理；消息 ID 由项目自行生成并维护。
- **相关方**：前端聊天页、后端 AI 路由与 chat 模块、数据库 schema。

## Goals / Non-Goals

**Goals:**

- 前端展示当前用户的会话列表，支持选中切换会话并加载该会话历史消息；支持「新建会话」入口，会话在用户发送第一条消息后再创建。
- 后端持久化会话与消息；消息表形态与 AI SDK UIMessage 对齐（如 role、parts），消息 ID 项目自维护；Chat API 支持可选 `sessionId`，首条消息时创建会话并写库，后续请求在已有会话下追加并持久化。
- 前端用 zustand 管理会话列表与当前会话状态，与 `useChat` 配合传 `sessionId` 等。

**Non-Goals:**

- 本阶段不实现会话/消息的分享、多端同步、消息编辑或删除能力；不改变现有 AI 调用链（provider/model/tools）或认证方式。

## Decisions

### 1. 表结构与关联方式

- **关联方式**：表与表之间仅做**逻辑关联**，不使用数据库外键（不在 Prisma 中写 `@relation` / `references`）。Session 存 `userId`（BigInt），Message 存 `sessionId`（BigInt），查询时在应用层按 `userId`/`sessionId` 过滤与校验归属。
- **主键与 ID**：所有表主键及逻辑关联字段均使用 **Snowflake BigInt**，由项目现有 `common/snowflake` 的 `generateUUID()` 生成，保证全局唯一、有序且与现有 User 表 `id` 类型一致。

### 2. 表结构细化（Prisma）

**Session 表**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInt @id | Snowflake 主键 |
| user_id | BigInt | 所属用户 ID（逻辑关联 User，无 FK） |
| title | String? | 会话标题，可选，可用首条消息摘要或占位 |
| create_time | DateTime | 创建时间 @default(now()) |
| update_time | DateTime | 更新时间 @updatedAt |

- 查询当前用户会话列表：`WHERE user_id = ?`，按 `update_time` 倒序。
- 校验会话归属：读 Session 时校验 `user_id` 与当前 JWT 用户一致。

**Message 表**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInt @id | Snowflake 主键，即 UIMessage.id，客户端可复用 |
| session_id | BigInt | 所属会话 ID（逻辑关联 Session，无 FK） |
| role | String | 枚举：user / assistant / system |
| parts | Json | AI SDK 的 parts 结构（如 text、tool-call、tool-result 等） |
| create_time | DateTime | 创建时间 @default(now()) |
| update_time | DateTime | 更新时间 @updatedAt |

- 消息顺序：按 `create_time` 或 `id` 升序。
- 助手消息的 `parts` 在流式结束前可为占位（如空数组或未完成内容），流式结束后一次更新为最终内容。

- **替代方案**：不单独建 Session 表、仅用 Message 表按“会话”分组——不利于按会话查列表与元数据，故采用 Session + Message 双表。

### 3. 消息创建与更新时机

- **用户消息**：在收到用户消息、进入 `streamText` **之前**创建一条 Message 记录，写入 `role: user` 及最终 `parts`，无需后续更新。
- **助手消息**：在**开始流式响应时**创建一条 Message 记录（`role: assistant`，`parts` 可为空或占位）；在**流式结束后**对该条记录做一次 **UPDATE**，写入最终的 `parts`（完整文本与 tool 结果等）。不采用“流结束再 INSERT”，以便前端在流式过程中即可用该消息 id 展示占位或增量。
- **ID**：每条消息的 `id` 由后端 Snowflake 生成（BigInt，对外可转成 string 与 AI SDK UIMessage.id 兼容），写入 DB 与返回给客户端一致。

### 4. Chat API 请求体与创建会话时机

- **请求体**：`POST /api/ai/chat` 保持 `messages: UIMessage[]`，新增可选 `sessionId?: string`（API 层用 string 传 Session 的 Snowflake id）。无 `sessionId` 且当前为「新会话」时，在写入第一条用户消息前用 Snowflake 创建 Session，再写 Message，并在响应中通过约定（如 stream metadata 或首 chunk）把新 `sessionId` 带给前端；有 `sessionId` 时在应用层校验 Session 归属（`user_id` = 当前用户）后在该会话下追加消息。
- **创建会话时机**：仅在用户发送第一条消息时创建会话（即「新建会话」点击后不立刻调后端建会话，第一次 submit 时由后端创建）。前端「新建会话」仅清空当前消息并置空 currentSessionId，不调后端。
- **替代方案**：前端先调「创建会话」接口再发消息——多一次往返且与「首条消息后创建」需求不符，故不采用。

### 5. 前端状态（zustand）

- **Store 形态**：例如 `sessionList: { id, title?, updateTime }[]`、`currentSessionId: string | null`（id 为 Session 的 Snowflake id 的 string 形式）。会话列表由后端接口拉取（如 `GET /api/ai/sessions`）；切换会话时设置 `currentSessionId` 并拉取该会话消息填充 `useChat` 的初始 messages。
- **与 useChat 配合**：请求体通过 `body` 传 `sessionId: currentSessionId ?? undefined`；新建会话时 `currentSessionId` 为 null，后端创建会话后前端从响应中拿到新 sessionId 并更新 store 与列表。
- **替代方案**：用 React Context 或 URL 存当前会话——proposal 已定 zustand，且列表与当前会话多处复用，故用 zustand。

### 6. 历史消息加载

- **接口**：新增 `GET /api/ai/sessions/:sessionId/messages`（或等效）返回该会话下的 UIMessage 列表（按时间序），供前端切换会话时初始化 `useChat` 的 `initialMessages`。
- **格式**：返回结构与 AI SDK UIMessage 一致（id 为 Message 的 Snowflake id 的 string、role、parts），便于直接作为 `messages` 使用。

## Risks / Trade-offs

- **[流式与落库顺序]** 助手消息采用「开始流式时 INSERT + 流式结束后 UPDATE」。若进程在流式结束前崩溃，助手消息记录存在但 `parts` 未更新为最终内容。缓解：流式结束后务必执行 UPDATE；后续可考虑关键 chunk 或最终 content 的中间缓存以降低丢失范围。
- **[sessionId 回传]** 首条消息创建会话后，前端需拿到新 sessionId。若 stream 协议无预留字段，可在响应首行或自定义 SSE 字段带 sessionId，或采用「第一次请求不传 sessionId，响应后前端再调一次 sessions 列表取最新」的折中。需在实现时与前端约定。
- **[列表与当前会话一致性]** 新建会话后需把新会话插入 zustand 的 sessionList 并设为 currentSessionId，避免列表与当前不同步。

## Migration Plan

1. 在 Prisma schema 中新增 `Session`、`Message` 模型：主键与关联字段均为 BigInt，**不建外键**（无 `@relation`/references），仅逻辑关联；ID 由 `common/snowflake` 的 `generateUUID()` 生成。运行 `prisma migrate`。
2. 后端实现会话与消息的创建/查询（按 `user_id`、`session_id` 过滤与校验）、Chat 路由与 chat 模块接入 sessionId 与持久化逻辑；助手消息按「创建 + 流式结束后 UPDATE」实现。
3. 前端增加 zustand 依赖与 store、会话列表 UI、新建/切换会话、请求体带 sessionId 及历史加载。
4. 回滚：若需回滚，保留迁移可逆的迁移文件，或新增迁移删除新表；API 保持对「无 sessionId」的兼容（视为单次对话不落库或按现有行为）。

## Open Questions

- 新会话的 `title` 是否由后端用首条用户消息截断生成，还是先占位「新会话」待后续编辑，可在实现时定一版简单策略（如首条消息前 50 字）。
- `GET /api/ai/sessions` 的分页与排序（如按 update_time 倒序）在 spec 或实现中约定即可。
