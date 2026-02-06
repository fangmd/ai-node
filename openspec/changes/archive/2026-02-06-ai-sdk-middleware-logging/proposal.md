## Why

调试线上/本地 LLM 调用时，目前缺少“可控、结构化、可脱敏”的请求/响应日志，尤其是流式（streamText）场景只能看到最终结果，定位问题（参数、工具调用、provider 返回的 metadata、分段输出）成本高。

我们希望在 **不侵入 fetch 层** 的前提下，模仿 `@ai-sdk/devtools` 的思路，基于 AI SDK 的 **Language Model Middleware** 捕获并打印（或落盘）AI SDK 层的 raw provider request/response payload 与流式 parts，以便快速排障与回归验证。

## What Changes

- 新增一个可选的 AI SDK Language Model middleware，用于：
  - 记录/打印 `doGenerate` 的入参（params）与出参（result），包含 provider-specific metadata（若 provider 暴露）
  - 记录/打印 `doStream` 的入参（params）与流式输出 parts（例如 `text-delta`、tool call/结果、finish），并在结束时输出汇总
- 支持通过 `providerOptions` 传入 per-request 上下文（如 requestId、userId、baseURL、sessionId），用于日志关联与采样
- 提供基础脱敏：默认对 `Authorization`、`apiKey`、以及可配置字段进行遮盖
- 支持按环境/配置开关与采样，避免默认影响性能与泄露敏感信息

## Capabilities

### New Capabilities
- `ai-sdk-middleware-logging`: 在后端 AI 调用链中引入 AI SDK Language Model Middleware，实现 raw provider request/response 结构化日志与流式 parts 日志（不要求拿到原始 HTTP/SSE 字节流），包含开关、脱敏与采样。

### Modified Capabilities
- `backend-logging`: 需要补充一个“AI 调用日志 MUST 使用 common logger（Pino）”的要求，并允许在开发环境输出更详细的调试字段（仍保持 JSON/结构化），同时明确脱敏/采样约束。

## Impact

- **Backend code**: `apps/backend/src/ai/`（模型创建/封装处，使用 `wrapLanguageModel` 注入 middleware）；可能影响 `apps/backend/src/common/logger` 的字段约定与脱敏工具。
- **Runtime/Perf**: 流式日志需要在 AI SDK stream parts 层做 `TransformStream` 转发；默认应关闭或采样开启，避免 I/O 放大。
- **Security/Privacy**: 日志包含 prompts/outputs/tool args/result 的潜在敏感信息；需要默认脱敏、可配置白名单/黑名单，并确保不会把敏感日志写入 git。

