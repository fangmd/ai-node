## Context

目前后端已经有统一响应工具 `success()` / `fail()`（`apps/backend/src/response.ts`），但错误处理仍存在几类不一致：

- 路由层零散 try/catch，手工决定 500/503 等，重复且容易漏掉。
- 部分中间件直接 `c.json(...)`，未复用统一工具（例如鉴权 middleware）。
- `fail()` 当前不显式设置 HTTP status，容易出现“业务失败但 HTTP 200”的情况。
- 初始化/基础设施层直接 `throw new Error(...)`（env 校验、DB URL 校验），需要全局捕获映射，避免泄露内部细节。

本变更要做的是“统一业务报错的表达 + 统一捕获与映射”，并尽可能以最小改动渐进落地。

## Goals / Non-Goals

**Goals:**

- 在后端提供一个**统一定义业务错误**的地方（建议 `apps/backend/src/errors/`），集中导出业务错误类型与常用错误构造函数。
- 支持在任意层（service/middleware/route）通过 `throw` 抛出业务错误，由入口全局错误处理捕获并返回统一响应体。
- 统一 `fail()` 行为：**业务报错统一使用 HTTP status 200**，错误语义通过响应体 `code/msg/data` 表达（保持前端/调用方处理简单一致）。
- 提供一套可扩展的错误映射策略（Zod → 400、JWT → 401、404、409、503、未知 → 500），并保持生产环境不泄露敏感错误信息。
- 降低路由层圈复杂度：减少 try/catch，优先采用“抛错 + 全局处理”。

**Non-Goals:**

- 不引入重量级框架/全局 DI/复杂错误码体系（保持简单实用）。
- 不一次性重写所有路由；允许分阶段迁移，优先改动高风险/高频路径。
- 不改变现有成功响应结构（`{ code: 200, msg: "success", data }`）。

## Decisions

### Decision 1: 统一业务错误模块位置

选择在 `apps/backend/src/errors/` 集中管理业务错误（而不是散落在 service/route 内部）。

- **Why**: 可复用、可发现、便于全局映射，减少重复与圈复杂度。
- **How (shape)**:
  - `errors/app-error.ts`: `AppError`（携带 `code`, `message`, 可选 `data`, 可选 `cause`）
  - `errors/errors.ts`（或 `errors/index.ts`）: 常用构造函数（如 `unauthorized()`, `badRequest()`, `conflict()`, `serviceUnavailable()`…）
  - **Zod 校验提示类型**：提供 `validationError(...)`（或 `invalidParams(...)`）工厂函数，返回 `type: "validation"` 的错误，并可携带精简后的 `issues`（用于前端展示表单提示/Toast 文案）。
  - 提供 `isAppError()` type guard，保证全局 handler 简洁。

**Alternatives considered:**

- 在每个模块内部定义错误：会持续分散，不利于统一映射与复用。
- 直接使用 `HTTPException`：依赖 Hono 的异常形态，业务层表达不够清晰（但可以在全局映射中兼容它）。

### Decision 2: 全局 error/notFound 处理作为唯一出口

在 `apps/backend/src/index.ts` 增加 `app.notFound(...)` 与 `app.onError(...)`（或等价机制），作为统一错误返回出口。

- **Why**: 把“捕获与响应”从业务代码中剥离，减少每个 handler 的重复逻辑。
- **Rationale**: Hono 原生支持，侵入性低，符合“最小化修改”。

**Alternatives considered:**

- 每个路由 try/catch：重复、易漏、维护成本高。
- 在每个 route group 写一套 onError：仍然分散，难以一致。

### Decision 3: 错误映射规则（按来源/类型）

采用“类型优先、兜底最后”的映射策略：

1. `AppError` → 使用其 `code/msg/data`（HTTP status 统一为 200）
2. Zod 校验错误 → **转为单独的业务报错提示类型**（`type: "validation"`），并返回 `code=400`：
   - `msg`：统一为更友好的提示（例如 `"Invalid parameters"` / `"参数错误"`）
   - `data`：可选携带精简后的 issues（例如 `{ type: "validation", issues: [{ path, message }] }`）；生产环境可裁剪为不包含内部结构的摘要
3. 鉴权失败（JWT 校验失败）→ 401（建议在 middleware 直接 `throw unauthorized()`，而不是 `return c.json(...)`）
4. `notFound` → 404（统一格式）
5. 业务冲突（如用户名已存在）→ 409（通过 `conflict()`）
6. 配置缺失/上游不可用 → 503（通过 `serviceUnavailable()`，或将特定错误前缀映射为 503）
7. 未知异常 → 500（生产环境返回通用 msg；开发环境可附带简要信息）

### Decision 4: `fail()` 统一返回 HTTP 200（业务报错）

保持 `fail(c, code, msg, data)` 的 HTTP status 为 **200**（可显式写为 `return c.json({ code, msg, data }, 200)`），业务/错误语义由响应体中的 `code` 表达（例如 400/401/409/503/500 等）。

- **Why**: 客户端统一只处理一种 HTTP 成功返回（200），避免拦截器/异常分支分裂；同时保留统一响应体 `code/msg/data` 作为稳定契约。
- **Trade-off**: 监控、网关、缓存、重试等中间层更难仅通过 HTTP status 识别错误；需要在日志/指标中额外统计 `code != 200` 的比例，或在网关层做自定义度量。

## Risks / Trade-offs

- **[老代码依赖 HTTP 200 判断错误]** → **Mitigation**: 明确迁移说明；先改后端再同步前端处理；保持响应体结构不变。
- **[生产环境泄露内部错误信息]** → **Mitigation**: 全局 handler 对未知错误返回固定 msg；开发环境才输出详细日志/信息。
- **[错误类型过多导致复杂化]** → **Mitigation**: 仅保留一个 `AppError` + 少量工厂函数；不引入分层错误码体系。
- **[部分第三方/底层库错误难以识别]** → **Mitigation**: 提供兜底 500；必要时对少量已知错误做识别（例如配置错误前缀、Prisma 连接错误）。

## Migration Plan

1. **建立错误模块**：新增 `errors/`，定义 `AppError`、工厂函数、type guard。
2. **修正响应工具**：确保 `fail()` 返回 HTTP 200；（可选）补充 `fail` 的类型定义使其与 `ApiResponse` 对齐。
3. **入口统一捕获**：在 `index.ts` 添加 `notFound` 与 `onError`，将错误映射到 `fail()`。
4. **逐步迁移调用点**（低风险先行）：
   - `auth/middleware.ts`：由 `return c.json(...)` 改为 `throw unauthorized()`
   - `routes/*`：去掉重复 try/catch（能交给全局 handler 的就移除），保留必要的业务分支错误（通过抛 `AppError`）
5. **回归验证**：确保关键接口（auth、me、ai/chat）在 400/401/409/503/500 时返回统一格式，且 HTTP status 统一为 200（流式响应除外）。

回滚策略：如果线上发现“HTTP 200 + code!=200”导致的网关/监控识别困难，可切换策略为“HTTP status 与 code 对齐”（需要同步调整客户端），或在网关层补充基于响应体 `code` 的度量与告警。

## Open Questions

- 是否需要为“配置缺失/上游不可用”定义统一的错误码（仍使用 503 即可）与统一 msg 文案？
- Zod 校验错误的 msg：是保持通用 `"Bad Request"` 还是提供更友好但不泄露结构的提示？
