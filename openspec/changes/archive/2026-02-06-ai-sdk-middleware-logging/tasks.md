## 1. Spec & integration planning

- [x] 1.1 确认 AI SDK 版本与 provider middleware 类型（`LanguageModelV3Middleware` / stream part 类型）并记录到实现注释或文档
- [x] 1.2 确认 middleware 注入点：在 `getModel` 或 `createProvider` 返回 model 后统一 `wrapLanguageModel`，避免多处重复

## 2. Core middleware implementation

- [x] 2.1 新增 `ai` 目录下的 middleware 模块（例如 `apps/backend/src/ai/middlewares/logging.ts`），实现 `wrapGenerate`：记录脱敏/截断后的 `params` 与 `result`
- [x] 2.2 实现 `wrapStream`：对 `doStream()` 的 `stream` 使用 `TransformStream` 透传并按需记录 stream parts（至少覆盖 `text-delta`、tool call/结果、finish/error）
- [x] 2.3 实现脱敏工具：对 Authorization/apiKey/token/secret 等字段默认遮盖；支持递归对象与 headers
- [x] 2.4 实现截断工具：对长文本字段按 `maxFieldLength` 截断并标记 `(truncated)`

## 3. Configuration (enable + sampling)

- [x] 3.1 增加配置项（env/config）用于控制 `enabled` / `sampleRate` / `maxFieldLength`
- [x] 3.2 实现采样逻辑：在每次 model 调用开始时决定是否记录本次 invocation，确保同一次调用中各条日志一致

## 4. Wire into chat flow

- [x] 4.1 在 `streamChatFromUIMessages` 保持通过 `providerOptions` 传入请求上下文（requestId/sessionId/baseURL 等），并让 middleware 能读取并附加到日志
- [x] 4.2 确保所有 AI 日志通过 common logger 输出（无 `console.*`）

## 5. Verification

- [ ] 5.1 本地跑一条 `streamText` 请求，验证：doGenerate/doStream 的 payload 与 parts 能输出；敏感字段被脱敏；长字段被截断
- [ ] 5.2 验证采样与开关：默认不输出；开启后按 sampleRate 生效

