## Context

Backend 使用 Hono，当前路由直接返回 `c.json({ ... })`，格式不统一。主 spec（backend-api）已约定统一响应体 `{ code, msg, data }` 及工具函数要求，本变更负责实现：新增 response 工具、并让现有路由改用该工具返回。

## Goals / Non-Goals

**Goals:**

- 在 `apps/backend/src` 内提供 response 工具模块，导出成功/失败两种封装函数，符合主 spec 的格式与 HTTP 状态码约定。
- 将现有路由（如 `/`、`/health`）改为通过工具函数返回，保证响应体统一。

**Non-Goals:**

- 不新增路由或 API；不改变 CORS、构建、monorepo 配置。
- 不在此变更内修改前端代码（前端适配可后续单独做）。

## Decisions

- **工具模块位置与命名**：在 `apps/backend/src` 下新增单文件（如 `response.ts` 或 `utils/response.ts`），导出 `success` / `fail`（或 `ok` / `err`）等语义化函数名，便于路由调用。  
  _Alternatives_：放在中间件里统一包装——未采纳，因当前需求是显式调用、便于每个路由控制 data 与错误码。

- **与 Hono Context 的配合**：工具函数接收 Hono 的 `Context`（`c`）与 payload（如 `data` 或 `code, msg, data`），内部调用 `c.json(body, status)` 并返回其返回值，以便路由直接 `return success(c, data)` 或 `return fail(c, code, msg)`。  
  _Alternatives_：返回纯对象由路由自己 `c.json()`——未采纳，易忘设状态码且重复代码。

- **失败响应的默认 data**：失败时 `data` 默认为 `{}`，可选传入对象（如校验详情）以保持结构一致。

## Risks / Trade-offs

- **[Risk] 已有前端依赖当前 JSON 结构** → 已在 proposal 中标注 BREAKING；部署前需确认前端改为按 `code`/`msg`/`data` 解析，或本变更先上线后前端再适配。
- **[Trade-off] 所有路由需改一行调用** → 改动小、集中，可一次改完并随变更一起测试。

## Migration Plan

1. 实现 response 工具模块并补充类型（若有）。
2. 将 `index.ts` 中相关路由改为使用成功/失败工具函数。
3. 本地/CI 验证：请求 `/`、`/health` 等，检查响应体为 `{ code, msg, data }` 且 HTTP 状态码正确。
4. 无数据迁移；若有前端联调，安排前端按新格式解析后一起发布。

## Open Questions

无。实现范围与接口形态已由主 spec 与 proposal 确定。
