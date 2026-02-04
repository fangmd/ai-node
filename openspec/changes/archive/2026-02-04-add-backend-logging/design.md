# Design: 后端统一日志（Pino + JSON）

## Context

后端目前无统一日志方案，存在零散的 `console.log` / `console.error`（如 `index.ts` 启动信息与错误、`ai/middleware.ts` 的调试输出），不利于生产观测与级别控制。Proposal 与 spec 约定：在 common 下基于 Pino 提供统一 logger，输出 JSON，一次性替换全部 `console.*`。

## Goals / Non-Goals

**Goals:**

- 在 `apps/backend/src/common/` 下提供单一日志模块，基于 Pino，导出统一 logger。
- 日志输出为 JSON 格式，支持级别（debug/info/warn/error）与可选结构化字段。
- 通过环境变量（如 `LOG_LEVEL`）控制最低输出级别。
- 一次性将现有所有 `console.log` / `console.error` 替换为 logger 调用，并移除原 console 输出。

**Non-Goals:**

- 不改变 HTTP/API 对外行为。
- 不引入分布式追踪或复杂日志管道；仅规范输出格式与接入方式。
- 不强制前端或非 backend 应用使用此模块。

## Decisions

1. **模块位置与命名**
   - 在 `apps/backend/src/common/logger.ts` 实现并导出默认 `logger`。其他模块通过 `import { logger } from '@/common/logger'`（或项目约定的路径）使用。
   - 备选：`log.ts`；`logger.ts` 与常见命名一致，便于发现。

2. **Pino 配置**
   - 使用 Pino 默认配置即可得到 JSON 行输出；`level` 从环境变量 `LOG_LEVEL` 读取（如 `info`、`debug`），缺省时用 `info`。
   - 开发环境若需可读输出：可通过 `LOG_PRETTY=true` 或 `NODE_ENV=development` 启用 pino-pretty 作为 transport；设计上以 JSON 为规范，pretty 为可选增强。
   - 备选：仅 JSON，不提供 pretty；为本地调试友好保留可选 pretty，不影响生产。

3. **接口形态**
   - 对外暴露 Pino 的 `logger.info(msg)`、`logger.info(obj, msg)`、`logger.warn`、`logger.error`、`logger.debug` 等标准用法，便于传递结构化字段（如 `logger.info({ path, method }, 'Request')`）。
   - 不在此次封装自定义 API 层，直接 re-export 或 thin wrap Pino 实例，减少维护成本。
   - 备选：自建 `log.info('msg', { key: value })` 签名；与 Pino 原生签名一致更利于查阅文档与类型。

4. **替换范围**
   - 仅限 `apps/backend/src/` 下应用代码：`index.ts`、`ai/middleware.ts` 等已发现的 `console.*` 全部改为 logger；并全局搜索确保无遗漏。
   - 构建/测试脚本中的 console 可保留（若存在），不纳入本次替换。

5. **依赖**
   - 新增依赖：`pino`。可选：`pino-pretty` 仅开发时使用（devDependencies 或按环境条件 require）。

## Risks / Trade-offs

- **LOG_LEVEL 未设置**：缺省使用 `info`，避免生产刷屏。→ 在 logger 初始化时读取 `process.env.LOG_LEVEL` 或 config（若已统一 env），缺省为 `'info'`。
- **敏感信息**：避免在日志中打印密码、token、完整请求体。→ 不在 design 中实现脱敏逻辑，但约定：调用方不把敏感字段放入 structured payload；后续若有需求再加 redact。
- **启动顺序**：若 logger 在 config 之前使用且 config 未加载，则需能读取 `process.env.LOG_LEVEL`。→ logger 为轻量依赖，仅读 `LOG_LEVEL` 时可直接读 env；若项目已统一 config，可改为从 config 读。

## Migration Plan

1. 在 backend 中新增依赖 `pino`（及可选 `pino-pretty`）。
2. 新增 `apps/backend/src/common/logger.ts`，创建并导出 Pino 实例，level 由 `LOG_LEVEL`（或 config）决定，输出 JSON。
3. 在 `index.ts`、`ai/middleware.ts` 等所有使用 `console.log`/`console.error` 的文件中改为使用 `logger`，并删除原 console 调用。
4. 全局搜索 `console.log`、`console.warn`、`console.error` 于 `apps/backend/src`，确保无遗漏。
5. 本地启动与现有接口验证，确认行为无回归；必要时调整默认 level 或 pretty 条件。

无需功能开关；变更仅为内部日志实现，回滚即还原提交。

## Open Questions

- 无。若后续需要 requestId、traceId 等，可在 logger 上使用 Pino child logger 在中间件中绑定上下文。
- 是否从统一 config 读 `LOG_LEVEL`：若 backend 已有 `config.server` 或类似，可在此步骤中改为从 config 读，与 env 规范一致；否则先读 `process.env.LOG_LEVEL` 即可。
