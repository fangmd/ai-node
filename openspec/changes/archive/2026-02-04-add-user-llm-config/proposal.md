## Why

当前 AI 能力缺少用户维度的大模型配置管理能力，无法满足「每个用户使用自己的大模型配置」的需求；同时 Chat 无法在会话级别绑定模型，导致用户无法在不同会话中稳定复用不同模型配置。需要引入用户侧大模型配置管理与会话绑定，提升可用性与可控性。

## What Changes

- 新增「设置」模块，并在设置内新增「大模型管理」页面，支持用户维护自己的大模型配置（新增/编辑/删除/设置默认）。
- 新增用户维度的大模型配置数据模型并落库，与用户关联；敏感字段（如 `apiKey`）不得明文回传，需安全存储。
- Chat 页面在聊天输入框上方增加模型选择下拉框，用户可为当前会话选择模型。
- 会话（Session）绑定 `llmConfigId`：
  - 创建新会话时记录选择的 `llmConfigId`（或使用用户默认模型）。
  - 已存在会话中切换模型会更新该会话绑定的 `llmConfigId`，后续消息均使用该绑定模型。
  - 当会话 `llmConfigId` 为空时，默认使用用户设置的默认 `llmConfigId`；并在首次聊天时可自动补齐该会话的绑定以确保“会话绑定模型”的一致性。
- 当用户未配置任何可用模型时，Chat 需要明确提示用户先前往设置完成大模型配置（不再依赖服务端全局默认配置）。
- 相关 API 返回会话的 `llmConfigId`，以便前端展示与恢复会话模型选择。

## Capabilities

### New Capabilities

- `llm-config`: 用户大模型配置的管理能力（落库、与用户关联、默认配置、供 Chat 选择与绑定使用）。

### Modified Capabilities

- `backend-ai-api`: Chat/Session API 行为变更以支持会话绑定 `llmConfigId`、按会话/用户默认模型选择 provider/model，并在会话 `llmConfigId` 为空时回退到用户默认模型。
- `session-list-ui`: 会话列表与会话切换需要携带/展示会话绑定的 `llmConfigId`，并在进入会话时驱动 Chat 页模型选择的恢复。
- `frontend-app`: 新增设置模块与大模型管理页面；Chat 页新增模型选择交互并与会话绑定联动。

## Impact

- **Database/Prisma**: 增加用户大模型配置表；`session` 表需要新增可空的 `llm_config_id`（用于绑定会话模型配置）。
- **Backend**:
  - 增加大模型配置管理相关 API（归属校验、默认设置、敏感信息保护）。
  - 调整 `/api/ai/chat` 与 session 相关接口以支持会话绑定与回退规则。
  - AI provider/model 获取逻辑需要从“用户配置/会话绑定”读取（不依赖 env 全局默认配置）。
- **Frontend**:
  - 新增设置模块路由与 UI（大模型管理）。
  - Chat 页增加模型选择并绑定会话，切换会话时恢复选择。
- **Security**: `apiKey` 等敏感信息需安全存储与日志脱敏，禁止明文回传到前端。

