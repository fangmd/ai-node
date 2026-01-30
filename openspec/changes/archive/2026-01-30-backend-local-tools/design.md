# Design: backend-local-tools

## Context

- 当前 chat 在 `apps/backend/src/ai/chat.ts` 中通过 `tools(provider)` 只注册了 provider 工具（如 `web_search`）。
- 需求：在 `streamText` 中增加**本地工具**，首个工具为 `get-server-ip`，固定返回 `0.0.0.0`。
- 约束：不新增依赖，使用 AI SDK 现有 tool API；不新增 HTTP 接口，工具仅通过 chat 流被模型调用。

## Goals / Non-Goals

**Goals:**
- 在 chat 的 `streamText` 中注册本地工具，与现有 provider 工具并存。
- 实现本地工具 `get-server-ip`，返回固定值 `0.0.0.0`。
- 保持代码结构清晰、便于后续扩展更多本地工具。

**Non-Goals:**
- 不做真实网卡 IP 探测或配置化 IP。
- 不改变现有 chat 请求/响应形态；不新增环境变量或配置。

## Decisions

1. **本地工具与 provider 工具合并方式**  
   - 选择：在 `chat.ts` 的 `tools(provider)` 中，返回 `{ ...providerTools, ...localTools }`，即本地工具与 provider 工具同一层、一起传给 `streamText`。  
   - 理由：AI SDK 的 `tools` 为单一大对象，合并后模型可同时调用 web_search 与 get-server-ip；实现简单，无需改路由或请求体。  
   - 备选：单独一层「local tools」命名空间——会增加一层结构且当前仅一个工具，不采纳。

2. **本地工具代码位置**  
   - 选择：在 `apps/backend/src/ai/` 下新增 **tools 文件夹**（`src/ai/tools/`），其下导出本地工具集合（如 `tools/index.ts` 汇总，或按工具分文件），在 `chat.ts` 中 `import { localTools } from './tools'` 并合并进 `tools(provider)`。  
   - 理由：与「AI 相关逻辑在 ai 目录」一致；独立文件夹便于扩展多个工具、职责清晰。  
   - 备选：单文件 `localTools.ts`——多工具时易膨胀，不采纳。

3. **工具名与返回值**  
   - 选择：工具名使用 `get_server_ip`（snake_case，与现有 `web_search` 一致）；无参数；execute 固定返回 `"0.0.0.0"`（或 `{ ip: "0.0.0.0" }`，以简单字符串为主，便于模型直接使用）。  
   - 理由：proposal 明确写死返回 0.0.0.0；snake_case 与现有工具风格统一。

## Risks / Trade-offs

- **风险**：未来若增加敏感本地工具，需在 design/impl 中考虑权限或审计。  
  **缓解**：本期仅只读、固定值工具；后续新工具再单独评审。
- **取舍**：固定 IP 不反映真实环境，仅用于占位与联调。  
  **接受**：符合当前 proposal 范围，真实 IP 留作后续迭代。
