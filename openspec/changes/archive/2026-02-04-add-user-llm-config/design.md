## Context

当前后端 AI 调用逻辑缺少用户/会话维度的模型配置选择能力，Chat API（`/api/ai/chat`）只接收 `messages` 与可选 `sessionId`，不会在用户维度或会话维度选择模型。前端 Chat 页也没有模型选择入口。

本变更需要引入用户侧大模型配置（落库、与用户关联、支持默认项），并将模型选择与会话绑定：同一个会话内的所有消息默认使用同一条模型配置（`llmConfigId`），且当会话未绑定时会回退到用户默认配置。

约束与现状：
- 单体仓库、前后端分离（`apps/backend` + `apps/frontend`）。
- 现有 DB 使用 Prisma + MySQL，已有 `user/session/message` 表。
- `Session.id/User.id/Message.id` 为 BigInt（雪花风格），前端通过 `json-bigint` 以 string 处理。
- 现有 AI provider 仅支持 `openai`/`deepseek` 两类（OpenAI-compatible baseURL + apiKey）。

## Goals / Non-Goals

**Goals:**
- 引入 `llm-config`：用户可在设置中维护自己的模型配置（CRUD + 设置默认）。
- `Session` 增加可空 `llmConfigId` 绑定；Chat 请求与服务端推理逻辑按“会话绑定 → 用户默认”选择模型（不依赖 env 全局默认配置）。
- Chat UI 在输入框上方提供模型选择，下拉选择需与会话绑定一致（切换会话时恢复绑定；切换模型会更新会话绑定）。
- 安全：`apiKey` 不明文回传；落库需加密或至少不可逆保护；日志不得泄露敏感信息。

**Non-Goals:**
- 不做多 provider 生态扩展（只覆盖现有 `openai/deepseek`，未来再扩）。
- 不做会话历史的“按消息级别不同模型”的混用能力（保持会话级别绑定）。
- 不在本次引入复杂权限体系/团队共享模型配置（仅用户私有）。

## Decisions

### 1) 数据模型：新增 `llm_config` 表 + `session.llm_config_id` 可空外键字段

选择原因：
- 满足“落库+用户关联+可多条配置”的核心诉求。
- `session.llm_config_id` 可空：兼容历史会话；当会话未绑定时可通过用户默认配置补齐绑定。

建议字段（概念层，最终以 Prisma 为准）：
- `llm_config`: `id`, `user_id`, `name`, `provider`, `base_url`, `model_id`, `api_key_enc`, `is_default`, `create_time`, `update_time`
- `session`: 增加 `llm_config_id`（nullable）

默认唯一性处理：
- 通过服务端事务/批量更新保证“同一用户最多一个 `is_default=true`”。

### 2) 安全存储：`apiKey` 加密后落库，接口不返回明文

选择原因：
- `apiKey` 属于高敏数据；前端仅需要“是否已设置”与编辑时重新输入能力。

方案：
- 使用服务端密钥（新 env，如 `AI_KEY_ENCRYPTION_SECRET`）对 `apiKey` 做对称加密（例如 AES-256-GCM），落库保存 `iv/ciphertext/authTag` 的组合串。
- API 返回中仅提供 `hasKey: true/false`，不返回明文。

备选：
- 仅做不可逆 hash（不可用，因为推理时需要明文 apiKey）。

### 3) 模型选择优先级与会话绑定补齐

推理与绑定规则（统一后端与前端）：
- **已有会话**：
  - 若会话已有 `llmConfigId`：始终使用该配置。
  - 若会话 `llmConfigId` 为空：优先使用用户默认配置；并在首次 chat 时将会话 `llmConfigId` 自动更新为该默认配置（“补齐绑定”）。
  - 若请求显式携带 `llmConfigId`（用户切换模型）：校验归属后更新会话绑定，并使用新配置推理。
- **新会话**：
  - 若请求携带 `llmConfigId`：用它创建会话并绑定。
  - 否则若用户有默认配置：用默认配置创建会话并绑定。
  - 否则：拒绝聊天并提示用户先完成大模型配置（避免隐式使用服务端全局默认配置）。

### 4) API 设计：settings 模块提供模型配置管理；AI Chat 支持会话绑定字段

后端新增 settings 路由（示例路径，可调整但保持语义清晰）：
- `GET /api/settings/llm/configs`
- `POST /api/settings/llm/configs`
- `PUT /api/settings/llm/configs/:id`
- `DELETE /api/settings/llm/configs/:id`
- `POST /api/settings/llm/configs/:id/default`

现有 AI 路由调整：
- `GET /api/ai/sessions` 返回 `llmConfigId`
- `POST /api/ai/chat` body 增加可选 `llmConfigId`（用于新会话选择或会话内切换）

### 5) 前端路由与 UI：新增设置模块；Chat 模型选择与会话联动

前端新增：
- `/settings`（设置入口）
- `/settings/llm`（大模型管理）

Chat 页：
- 输入框上方增加模型选择下拉。
- 当选中会话时：
  - 若 session 带 `llmConfigId`：下拉选中该项。
  - 若为空：选中用户默认配置（如存在），并在首次发送时触发后端补齐绑定。
- 切换模型：下一次发送携带 `sessionId + llmConfigId`，由后端更新绑定。

## Risks / Trade-offs

- **[风险] apiKey 泄露（日志/返回/前端存储）** → **[缓解]** API 不返回明文；后端日志脱敏；前端不持久化 apiKey。
- **[风险] 默认配置唯一性竞争（并发设置默认）** → **[缓解]** 在服务端使用事务：先清空该用户所有默认，再设置目标为默认。
- **[风险] 删除被会话引用的配置** → **[缓解]** 最小实现：删除时将引用会话的 `llm_config_id` 置空（回退规则仍可用）；或直接阻止删除并提示（后续增强）。
- **[风险] 用户无可用模型配置导致无法聊天** → **[缓解]** 前端在 Chat 页面与设置模块提供显式引导（空状态提示/跳转），后端返回明确错误码与提示信息。
- **[权衡] 会话绑定“补齐默认”会改变历史会话的后续行为** → **[说明]** 这是期望行为：会话一旦开始就固定模型；对旧会话第一次继续聊天时补齐绑定能保证一致性。

