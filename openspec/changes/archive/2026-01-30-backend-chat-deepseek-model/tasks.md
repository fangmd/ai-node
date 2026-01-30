## 1. Provider 与模型配置

- [x] 1.1 实现按 `AI_PROVIDER` 选择 provider 的工厂：未设置时视为 `openai`；`openai` 使用 `OPENAI_BASE_URL`、`OPENAI_API_KEY`，`deepseek` 使用 `DEEPSEEK_BASE_URL`、`DEEPSEEK_API_KEY`；缺失必要 env 时抛错并指明缺少的变量名
- [x] 1.2 将 `getModel(provider)` 改为从 env 读取 `AI_MODEL`，未设置时按 provider 使用默认模型（`openai` → `gpt-5.2`，`deepseek` → `deepseek-chat`）

## 2. 配置与文档

- [x] 2.1 更新 `apps/backend/.env.example`：增加 `AI_PROVIDER`、`AI_MODEL` 及（DeepSeek）`DEEPSEEK_BASE_URL`、`DEEPSEEK_API_KEY`，并补充注释说明可选值与示例（如官方 DeepSeek 端点）
