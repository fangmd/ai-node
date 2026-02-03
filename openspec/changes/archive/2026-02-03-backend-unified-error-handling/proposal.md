## Why

当前后端错误处理较分散：部分路由用 try/catch 手动决定返回码，部分中间件/工具函数直接返回 JSON 或抛出 `Error`；同时 `fail()` 未显式设置 HTTP status，容易出现“业务失败但 HTTP 200”的不一致情况。需要统一一套**可复用、可扩展**的业务报错处理方式，降低重复代码、避免泄露内部错误细节，并让前端能够稳定依赖 HTTP status + 统一响应体进行处理。

## What Changes

- 增加统一的业务错误表达方式（例如 `AppError` / `BusinessError`），支持携带 `code`、`msg`、可选 `data`，用于在任意层（service/middleware/route）抛出并被统一捕获。
- 提供一个**集中定义业务错误**的代码位置（例如 `apps/backend/src/errors/` 或 `apps/backend/src/common/errors.ts`），统一导出错误类型与常用错误构造函数，避免在各模块内散落定义。
- 在 Hono 应用入口增加统一的错误捕获与 404 处理（例如 `app.onError` / `app.notFound`），将未捕获异常、鉴权失败、参数校验失败等映射到统一响应体，并设置正确的 HTTP status。
- 规范化 `success()` / `fail()`：
  - `success()` 维持现状（HTTP 200 + `{ code: 200, msg: "success", data }`）
  - `fail()` 必须显式设置 HTTP status（与 `code` 对齐），保证“失败响应不再是 HTTP 200”
- 对常见错误来源提供稳定映射规则（不在 proposal 里展开实现细节，设计阶段明确）：
  - 请求体/参数校验（Zod）→ 400
  - 鉴权失败（JWT）→ 401
  - 资源不存在 → 404
  - 业务冲突（如用户名已存在）→ 409
  - 配置缺失/上游不可用（如 AI provider 配置缺失）→ 503
  - 未知异常 → 500（生产环境避免直接暴露内部堆栈/敏感信息）
- 路由层减少重复 try/catch：推荐通过抛出统一错误 + 全局 handler 返回，必要时仍可显式 `return fail(...)`（兼容渐进改造）。

## Capabilities

### New Capabilities

- （无）

### Modified Capabilities

- `backend-api`: 补充/强化“统一响应格式”的**错误处理要求**（失败响应必须携带正确 HTTP status；未捕获异常与 404 必须返回统一格式；提供全局错误处理入口，降低每个路由重复错误处理逻辑）

## Impact

- **受影响代码**: `apps/backend/src/index.ts`（全局 error/notFound 处理）、`apps/backend/src/response.ts`（fail 设置 status）、`apps/backend/src/auth/middleware.ts`（401 统一返回）、以及部分路由/服务中对错误处理的改造（减少重复 try/catch，改为 throw 统一错误）。
- **对 API/客户端的影响**: 之前“错误但 HTTP 200”的情况会被纠正为对应的 4xx/5xx；前端/调用方如果依赖了 HTTP 200 来判定失败，需要调整为根据 HTTP status + 响应体 `code/msg` 处理。
- **依赖与系统**: 不期望引入大型新依赖；以最小改动为主，优先复用现有 `success`/`fail` 工具与 Hono 机制。
