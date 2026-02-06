## Context

- 当前后端通过 AI SDK（`ai` + `@ai-sdk/openai` / `@ai-sdk/deepseek`）在 `apps/backend/src/ai/` 发起模型调用，并使用 `streamText` 做流式输出。
- 现状缺口：缺少可控的“AI SDK 调用层”日志（params / result / provider metadata / streaming parts）。fetch 层可以拿到原始 HTTP，但侵入性更强且难以关联到 AI SDK 的语义事件（tool call、text delta 等）。
- 目标：模仿 `@ai-sdk/devtools` 的机制，基于 **Language Model Middleware** 以最小侵入的方式实现可开关的日志能力，并与现有 `backend-logging`（Pino common logger）保持一致。

## Goals / Non-Goals

**Goals:**
- 提供一个可复用的 AI SDK Language Model Middleware（`LanguageModelV3Middleware`），支持：
  - `wrapGenerate`: 打印/落盘 `doGenerate` 的 `params` 与 `result`
  - `wrapStream`: 在不破坏下游消费的前提下，打印流式 parts（如 `text-delta`、tool call/结果、finish），并在结束时输出汇总
- 与 common logger 集成：所有日志通过 `apps/backend/src/common/*logger*` 输出结构化 JSON（不使用 `console.*`）。
- 默认安全：脱敏（Authorization/apiKey）、截断（大字段）、可配置开关与采样。
- 支持 per-request metadata：通过 `providerOptions`（例如 `providerOptions.__llm`）把 requestId/sessionId/baseURL 等上下文附加到日志中。

**Non-Goals:**
- 不追求打印“原始 HTTP/SSE 字节流”或完整网络报文（该能力属于 fetch/HTTP 层；本方案关注 AI SDK 语义层）。
- 不引入 DevTools viewer（Web UI）或持久化 `.devtools` 格式；本实现以后端日志为主，可选落盘。
- 不在本次设计中引入新的外部可观测性平台（如 OTel collector / SaaS）。

## Decisions

### Decision: 使用 Language Model Middleware 而非 fetch 拦截

- **选择**：通过 `wrapLanguageModel({ model, middleware })` 注入 `LanguageModelV3Middleware`。
- **原因**：
  - 能直接拿到 `doGenerate/doStream` 的 `params`（结构化请求）和 `result`（结构化响应/metadata）
  - `wrapStream` 可在 AI SDK 的 stream parts 层做 `TransformStream`，同时满足“边转发边记录”
  - 与 provider 无关（OpenAI/DeepSeek 等都走同一 middleware 规范）
- **替代方案**：
  - fetch wrapper：能拿原始 HTTP/SSE，但更侵入、难与 AI SDK 语义事件对齐；且容易误读/消费 stream body。

### Decision: `wrapStream` 用 TransformStream 转发并采集

- **选择**：对 `doStream()` 返回的 `stream` 做 `pipeThrough(new TransformStream(...))`，在 `transform` 中：
  - 先 `controller.enqueue(part)` 转发给下游
  - 再根据 `part.type` 采集/打印（如 `text-delta` 追加到 buffer；tool call/结果单独记录）
  - `flush` 输出汇总（总文本、finishReason、token usage（如果在 rest 中可获得））
- **原因**：不消费原始 Response.body，不破坏 AI SDK 下游处理；实现简单、圈复杂度低。

### Decision: 日志字段与等级（level）约定

- **选择**：
  - 默认使用 `debug` 或更低级别输出大 payload（params/result/parts），并允许配置提升到 `info`
  - 结构化字段建议：
    - `event`: `ai.doGenerate.params` / `ai.doGenerate.result` / `ai.doStream.part` / `ai.doStream.finish`
    - `provider`, `modelId`（可从 params/metadata 推导）
    - `requestId`, `sessionId`, `userId`, `baseURL`（来自 `providerOptions.__llm`）
    - `payload`（已脱敏/截断后的对象）
- **原因**：避免生产默认刷屏；同时保留足够的关联维度便于检索。

### Decision: 脱敏与截断策略

- **脱敏**：
  - 默认对键名匹配 `authorization`, `apiKey`, `token`, `secret`（大小写不敏感）的字段做遮盖
  - 对 headers 中的 `Authorization` 强制遮盖
- **截断**：
  - 对文本类字段（prompt/output/tool args/result）按配置限制最大字符数，并追加 `…(truncated)`
- **原因**：满足安全与性能；避免把敏感内容写入日志系统。

### Decision: 开关与采样

- **选择**：通过 backend env/config 控制：
  - `enabled`（默认 false）
  - `sampleRate`（0..1）
  - `maxFieldLength`（截断阈值）
- **原因**：日志是排障工具，默认关闭；采样是控制成本的最简单手段。

## Risks / Trade-offs

- **[Risk] 日志泄露敏感信息** → **Mitigation**：默认脱敏 + 截断；生产默认关闭；对字段做 allow/deny 列表。
- **[Risk] 性能与 I/O 放大** → **Mitigation**：默认关闭；采样；大 payload 使用 `debug`；限制每次记录的字符数。
- **[Risk] provider metadata 不稳定**（不同 provider 字段差异） → **Mitigation**：日志输出以“尽力而为”为原则，优先记录 `params` 与通用字段；provider-specific 作为可选字段。
- **[Risk] 流式 parts 类型不全覆盖** → **Mitigation**：采用白名单（text/tool/finish/error）处理，其余类型透传但不解析，仅记录 type。

