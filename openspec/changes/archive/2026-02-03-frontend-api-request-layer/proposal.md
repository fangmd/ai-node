# Proposal: 前端接口请求层

## Why

前端目前用原生 `fetch` 和分散的请求逻辑（如 `lib/api.ts` 中混用通用 request 与业务 getMe），缺少统一的 HTTP 客户端与清晰的请求分层。引入基于 **axios** 的请求层并划分 **lib 封装** 与 **api 业务请求**，可统一 baseURL、鉴权、错误与 401 处理，便于维护和扩展。

## What Changes

- 在 **lib** 下新增 axios 封装：可配置的 axios 实例（baseURL、请求/响应拦截器：自动携带 Token、统一 401 处理与可选 onUnauthorized 回调）。
- 新增 **api** 目录：按业务模块存放接口（如 `api/auth.ts`、`api/me.ts`），所有业务请求通过该目录发起，内部使用 lib 中的 axios 实例。
- 将现有 `lib/api.ts` 中的 `request`/`getMe` 等逻辑迁移到新请求层（axios 实例 + api 模块），并逐步移除或替换对原 `request()` 的直接使用。
- 不改变现有后端接口契约（URL、请求/响应形状），仅前端实现方式调整。

## Capabilities

### New Capabilities

- **frontend-api-client**: 前端统一 API 客户端能力。包含：(1) lib 下的 axios 实例封装（配置、拦截器、鉴权与 401 处理）；(2) `src/api` 目录规范及业务请求模块（如 auth、user/me），供页面与组件调用。

### Modified Capabilities

- （无。本次为前端内部实现与目录结构变更，不修改现有 frontend-app / frontend-login 等 spec 的对外行为与需求。）

## Impact

- **代码**：`apps/frontend/src/lib/` 新增 axios 封装（如 `request.ts` 或 `axios.ts`）；新增 `apps/frontend/src/api/` 及若干业务模块；现有使用 `lib/api.ts` 的页面（如 me、login、ProtectedRoute）改为使用 `api/*` 与 lib 中的 axios 实例。
- **依赖**：前端增加 `axios`。
- **受影响文件**：`lib/api.ts`（迁移后删除或仅做重导出）、`lib/auth.ts`（可能被 axios 拦截器引用）、调用 `request`/`getMe` 的页面与组件。
