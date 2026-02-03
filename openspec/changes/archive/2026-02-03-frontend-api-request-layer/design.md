# Design: 前端接口请求层

## Context

前端应用当前在 `lib/api.ts` 中使用原生 `fetch`，混合了通用请求封装（`request`、鉴权、401 处理）与业务接口（如 `getMe`）。没有统一的 baseURL 配置，也没有按业务划分的请求模块。本次在保持与后端契约不变的前提下，引入 axios 作为统一 HTTP 客户端，并明确分层：lib 提供封装实例，api 目录承载业务请求。

## Goals / Non-Goals

**Goals:**

- 在 `lib` 下提供单一、可配置的 axios 实例，统一 baseURL、请求/响应拦截器（自动携带 Token、401 时清 token 并可选触发 onUnauthorized）。
- 新增 `src/api` 目录，按业务模块组织接口（如 auth、me），所有业务请求通过 api 模块发起并复用 lib 中的 axios 实例。
- 将现有对 `lib/api.ts` 的调用迁移到新请求层，不改变对外接口契约（URL、请求/响应形状）。

**Non-Goals:**

- 不改变后端 API 契约或新增后端接口；不引入请求缓存、重试、请求取消等高级能力（可后续迭代）。

## Decisions

1. **HTTP 客户端选型：axios**
   - 理由：拦截器、默认 JSON 处理、统一错误形态，便于集中处理 401 与鉴权。团队已约定使用 axios。
   - 备选：继续使用 fetch + 自封装。不选原因：需自行实现拦截、错误归一化，增加维护成本。

2. **axios 实例放置与命名**
   - 在 `apps/frontend/src/lib/` 下新增一个文件（如 `request.ts` 或 `axios.ts`）导出配置好的 axios 实例，供 `api/*` 引用。
   - 实例配置：`baseURL` 使用相对路径或环境变量（与现有前端代理一致）；请求拦截器注入 `Authorization: Bearer <token>`（从现有 `lib/auth.ts` 读 token）；响应拦截器在 401 时调用 `clearToken()` 并可选执行 `onUnauthorized` 回调（与现有 `setOnUnauthorized` 行为对齐）。

3. **业务请求目录结构**
   - 使用 `src/api/` 目录，按领域划分子模块（如 `api/auth.ts`、`api/me.ts`）。每个模块导入 lib 中的 axios 实例并导出业务方法（如 `getMe()`），不直接暴露 axios 或 fetch。

4. **对现有 `lib/api.ts` 的处理**
   - 迁移完成后，删除或将该文件改为从 `api/*` 与 lib 实例重导出，避免破坏已有引用。调用方（如 me、login、ProtectedRoute）改为从 `api/*` 与 lib 获取能力。

## Risks / Trade-offs

- **[Risk]** 多处页面仍引用 `lib/api.ts` 的 `request`/`getMe`，迁移遗漏会导致行为不一致。  
  **Mitigation:** 迁移时全局搜索对 `request`、`getMe`、`setOnUnauthorized` 的引用，逐一改为使用 api 模块与 lib 实例；必要时在过渡期保留 `lib/api.ts` 的薄重导出。

- **[Risk]** 引入 axios 增加 bundle 体积。  
  **Mitigation:** 接受适度体积增加；若后续有强体积约束，可再评估按需加载或替代方案。

## Migration Plan

1. 在 frontend 中安装 `axios` 依赖。
2. 在 `lib/` 下新增 axios 封装文件，创建实例并配置拦截器（含对 `getToken`/`clearToken`/`setOnUnauthorized` 的集成）。
3. 新建 `api/` 目录，添加 `auth.ts`、`me.ts` 等模块，将现有 `getMe` 等逻辑迁入并改用 axios 实例。
4. 将使用 `request`/`getMe`/`setOnUnauthorized` 的页面与组件改为从 `api/*` 与 lib 引用，并更新 `lib/api.ts` 为重导出或删除。
5. 验证登录、获取当前用户、401 登出等流程与现有行为一致。

## Open Questions

- 无。baseURL 与现有前端代理策略保持一致即可（相对路径或 env）。
