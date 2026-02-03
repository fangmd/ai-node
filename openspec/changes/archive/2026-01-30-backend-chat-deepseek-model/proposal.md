# Proposal: 后端 Chat 支持 DeepSeek 模型且模型类型由环境配置

## Why

当前 Chat 使用的模型标识在代码中硬编码（如 `gpt-5.2`），且仅对接单一 provider（OpenAI 兼容）。不同模型往往对应不同 provider（如 OpenAI 与 DeepSeek 使用不同 API 端点与鉴权）。需要支持通过环境变量指定**模型类型**与**使用的 provider**，便于不同环境切换模型与接入方式，且不修改代码即可生效。

## What Changes

- 新增环境变量：用于指定 Chat 所用**模型标识**（如 `AI_MODEL`，示例值 `deepseek-chat`、`gpt-5.2`）及**provider 类型**（如 `AI_PROVIDER`，示例值 `openai`、`deepseek` 等）。
- 后端 Chat 逻辑根据 env 选择对应 provider（如 OpenAI provider、DeepSeek provider），再使用 env 中的模型标识创建 model，不再在代码中写死模型名或单一 provider。
- 不同 provider 可对应各自的配置项（如 base URL、API key）；若复用现有 `OPENAI_*` 则保持兼容。
- 更新 `.env.example` 与文档，说明新变量及可选值。

## Capabilities

### New Capabilities

- 无（本次不新增独立能力，仅扩展现有 AI Chat 配置）

### Modified Capabilities

- **backend-ai-api**：Chat 所用**模型标识**与**provider 类型**均由环境变量配置；在“OpenAI config via environment”相关需求中补充“模型标识”与“provider 选择”的 env 配置要求及示例（如 deepseek-chat + deepseek provider）。

## Impact

- **代码**：`apps/backend/src/ai/chat.ts` 中按 env 选择 provider（如 `getProvider()` 或工厂根据 `AI_PROVIDER` 返回对应 provider），`getModel()` 使用 env 中的模型标识；若需兼容旧部署，可约定默认 provider 与默认模型。
- **配置**：`apps/backend/.env.example` 增加模型变量、provider 变量及说明；若支持多 provider，可增加各 provider 的 base URL / API key 等示例。
- **依赖**：可能引入对应 provider 的 SDK 或沿用现有 OpenAI 兼容 API（DeepSeek 等多为 OpenAI 兼容）；实现方式在 design 中确定。
