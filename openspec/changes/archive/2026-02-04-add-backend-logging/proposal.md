# Proposal: 后端增加日志功能

## Why

后端目前缺少统一的日志方案，调试与排查问题依赖零散的 `console.log`，不利于生产环境观测与日志级别管理。引入基于 Pino 的统一日志工具并放在 common 下，采用 JSON 格式输出，可让各模块复用同一套接口，便于后续按环境控制级别与日志采集。

## What Changes

- **统一日志工具**：在 `apps/backend/src/common/` 下新增日志模块，基于 Pino 封装，对外提供统一的 `logger`（或按需的 child logger）及 `info` / `warn` / `error` / `debug` 等级别接口；**日志输出格式统一为 JSON**。
- **技术选型**：使用 Pino 作为底层日志库，保证性能与结构化 JSON 输出。
- **接入方式**：后端各模块（路由、服务、AI、中间件等）通过 common 的日志工具输出日志；**本次一次性替换项目中已有的全部 `console.log`**，不再保留零散控制台输出。
- 不改变现有 API 或对外行为，仅增加日志能力与内部调用方式。

## Capabilities

### New Capabilities

- `backend-logging`: 后端统一日志能力；规定使用 Pino、日志输出为 JSON 格式、日志模块位置（common）、对外接口形式（级别、结构化字段约定）及与环境的配合方式（如 LOG_LEVEL）。

### Modified Capabilities

- （无。本次不修改现有 spec 的对外需求，仅新增日志实现与约定。）

## Impact

- **受影响代码**：新增 `apps/backend/src/common/logger.ts`（或 `log.ts`）；在 `apps/backend/src/index.ts`、各 route、service、ai、middleware 等所有使用 `console.log` 的位置一次性改为使用统一 logger，并移除原有 `console.log`。
- **依赖**：新增 `pino`（输出为 JSON，开发环境可选用 `pino-pretty` 做可读格式化）。
- **部署与运维**：可通过环境变量（如 `LOG_LEVEL`）控制级别；不影响现有部署流程。
