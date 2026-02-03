# Design: 后端 Chat 多 Provider 与模型环境配置

## Context

- 当前 Chat 在 `apps/backend/src/ai/chat.ts` 中固定使用 `@ai-sdk/openai` 的 `createOpenAI`，通过 `OPENAI_BASE_URL` 与 `OPENAI_API_KEY` 配置，模型名硬编码为 `gpt-5.2`。
- 需要支持按环境切换**模型**与**provider**（如 OpenAI vs DeepSeek），且 DeepSeek 等多为 OpenAI 兼容 API，可复用同一套 SDK、不同 base URL / API key。
- 约束：配置仅来自环境变量；不修改路由契约；与现有 local tools、web_search、UI message stream 行为兼容。

## Goals / Non-Goals

**Goals:**

- 通过环境变量选择 Chat 使用的 **provider**（如 `openai`、`deepseek`）和 **模型标识**（如 `gpt-5.2`、`deepseek-chat`）。
- 不同 provider 使用各自的配置（base URL、API key），例如 OpenAI 用 `OPENAI_*`，DeepSeek 用 `DEEPSEEK_*`。
- 保持现有 Chat 接口与流式行为不变；未配置时行为与当前一致或给出明确错误。

**Non-Goals:**

- 不在本次实现多模型/多 provider 的运行时动态切换（如按请求头切换）；仅进程级 env 配置。
- 不新增前端或其它后端服务；不改变 `/api/ai/chat` 的请求/响应格式。

## Decisions

### 1. Provider 与模型的环境变量

- **AI_PROVIDER**：取值如 `openai`、`deepseek`，决定使用哪一组 base URL / API key 及默认模型语义。
- **AI_MODEL**：模型标识，如 `gpt-5.2`、`deepseek-chat`；由 `getModel(provider)` 读取，传给 `provider(AI_MODEL)`。
- 各 provider 独立配置：
  - `openai`：`OPENAI_BASE_URL`、`OPENAI_API_KEY`
  - `deepseek`：`DEEPSEEK_BASE_URL`、`DEEPSEEK_API_KEY`（或与现有命名一致，如 `DEEPSEEK_BASE_URL` 默认可用官方端点）

**备选**：单一一组 `AI_BASE_URL` / `AI_API_KEY` 由 `AI_PROVIDER` 决定含义。不采纳：多 provider 时容易混淆，且与现有 `OPENAI_*` 并存时语义不清。

### 2. Provider 实现方式

- **结论**：继续使用 `@ai-sdk/openai` 的 `createOpenAI`，按 `AI_PROVIDER` 选择对应的 base URL 与 API key 传入。DeepSeek 提供 OpenAI 兼容 API，无需引入单独 `@ai-sdk/deepseek`（若未来有官方包再考虑）。
- **实现形态**：Provider 工厂函数（如 `getProvider()`）：读取 `AI_PROVIDER`，若为 `openai` 则 `createOpenAI({ baseURL: process.env.OPENAI_BASE_URL, apiKey: process.env.OPENAI_API_KEY })`；若为 `deepseek` 则 `createOpenAI({ baseURL: process.env.DEEPSEEK_BASE_URL, apiKey: process.env.DEEPSEEK_API_KEY })`。缺失必要 env 时抛错，错误信息指明缺少的变量。
- **备选**：为 DeepSeek 单独装一个 SDK。不采纳：当前生态下 OpenAI 兼容方案更简单，且与现有代码一致。

### 3. 模型标识来源

- **结论**：`getModel(provider)` 内使用 `process.env.AI_MODEL ?? 默认值`。默认值可按 provider 区分（如 `openai` 默认 `gpt-5.2`，`deepseek` 默认 `deepseek-chat`），或统一一个默认（如 `gpt-5.2`）以最小化行为变化。
- **建议**：优先「按 provider 的默认模型」：未设置 `AI_MODEL` 时，`openai` → `gpt-5.2`，`deepseek` → `deepseek-chat`；若设置则一律用 `AI_MODEL`。这样新加 provider 时行为可预期。

### 4. 向后兼容与默认值

- **AI_PROVIDER**：未设置时视为 `openai`，并继续仅校验 `OPENAI_BASE_URL` / `OPENAI_API_KEY`，与当前行为一致。
- **AI_MODEL**：未设置时使用上述按 provider 的默认模型。现有仅使用 OpenAI 的部署无需改 env 即可继续运行。

## Risks / Trade-offs

| 风险                                 | 缓解                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 多组 env 导致配置复杂、易配错        | `.env.example` 中列出所有 provider 的变量及示例；错误信息明确写出缺失的变量名。                                     |
| 某 provider 的 base URL / 模型名变更 | 文档与示例中说明常用值；默认模型随 provider 固定为推荐值。                                                          |
| 未来增加 provider 需改代码           | 采用小型 provider 注册表（如 `Record<AI_PROVIDER, { baseURLKey, apiKeyKey }>`），新增 provider 时只改配置表与文档。 |

## Migration Plan

1. **开发/部署**：在 backend 的 `.env` 中按需增加 `AI_PROVIDER`、`AI_MODEL` 及（若用 DeepSeek）`DEEPSEEK_BASE_URL`、`DEEPSEEK_API_KEY`；更新 `.env.example`。
2. **已有仅 OpenAI 的部署**：不设置 `AI_PROVIDER` / `AI_MODEL` 即可保持现状；或显式设置 `AI_PROVIDER=openai`、`AI_MODEL=gpt-5.2`。
3. **回滚**：回退代码即可；env 多出的变量可保留，不影响旧版本。

## Open Questions

- 是否在应用启动时校验当前 `AI_PROVIDER` 所需 env 已存在（fail-fast），还是在首次调用 `/api/ai/chat` 时再校验（与现有一致）：建议首次请求时校验，避免启动依赖未加载的 env 文件。
- `DEEPSEEK_BASE_URL` 是否在文档中给出官方默认值（如 `https://api.deepseek.com`）：建议在 `.env.example` 中写注释说明，代码中不写死默认 URL。
