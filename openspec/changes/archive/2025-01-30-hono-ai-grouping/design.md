# Design: Hono AI Grouping

## Context

- 后端为 Hono 应用，入口在 `apps/backend/src/index.ts`，已有根路由 `/`、`/health` 及 CORS、统一响应格式（`success`/`fail`）。
- 需要为 AI 相关能力预留独立 API 分组，便于后续扩展 chat、completions 等接口。

## Goals / Non-Goals

**Goals:**

- 在 Hono 中增加 `/api/ai` 路由分组，所有 AI 接口挂在该前缀下。
- 提供首个端点 `GET /api/ai/hello` 作为分组可用性验证，返回统一成功格式。

**Non-Goals:**

- 不引入新依赖、不改变现有 CORS/响应格式。
- 不实现具体 AI 业务逻辑（对话、补全等）在本设计中。

## Decisions

1. **分组实现方式**  
   使用 Hono 子应用 + `app.route(basePath, subApp)` 挂载。
   - 理由：与 Hono 官方推荐一致，路由按功能拆分到独立文件，主入口只做挂载，便于后续在 `routes/ai.ts` 内扩展更多 AI 路由。
   - 备选：在主 `index.ts` 内直接写 `app.get('/api/ai/hello', ...)`；不采用，因不利于后续 AI 路由集中管理。

2. **文件结构**
   - 新建 `apps/backend/src/routes/ai.ts`：创建 `new Hono()` 子应用，定义 `/hello` 等 AI 路由，使用现有 `success()` 返回。
   - 在 `index.ts` 中 `import ai from './routes/ai'` 并 `app.route('/api/ai', ai)`。
   - 理由：与「按能力分文件」的现有风格一致，改动集中在两处，影响面小。

3. **响应格式**  
   `/api/ai/hello` 使用既有 `success(c, data)`，返回 `{ code: 200, msg: "success", data }`，与 backend-api 规范一致，无需新约定。

## Risks / Trade-offs

- **[路由冲突]** 若未来在根应用也挂载 `/api/*` 其他分组，需注意路径前缀不重叠。→ 约定 `/api/<能力名>` 由各分组独占，命名清晰即可。
- 本变更仅新增路由与一个文件，无数据迁移、无回滚逻辑；部署即重启后端即可。
