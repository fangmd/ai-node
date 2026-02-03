## Why

Chat API (`/api/ai/chat`) 目前未做鉴权，任何能访问前端的用户都可直接调用，存在安全与滥用风险；用户登录态已存在（JWT），应对该接口做保护。同时，前后端 API 调用统一通过代理解决：开发环境使用 Vite 代理将 `/api` 转发到后端，生产环境使用 nginx 代理；前端始终使用相对路径 `/api/...`，不依赖 `VITE_API_ORIGIN`，部署与开发配置更简单、跨域更少。

## What Changes

- 对 `/api/ai/chat` 使用现有 `jwtAuth` 中间件，未带有效 JWT 的请求返回 401。
- 前端 Chat 页的 `DefaultChatTransport` 在请求头中传入 `Authorization: Bearer <token>`（从现有 token 存储读取）。
- API 调用统一用代理：开发环境用 Vite 代理、生产环境用 nginx 代理，前端统一请求相对路径 `/api/...`。**前端中所有使用 `VITE_API_ORIGIN` 的地方均可去掉**（如 `pages/chat.tsx`、`pages/home.tsx` 中的 `API_ORIGIN` 及 `vite-env.d.ts` 中的类型声明），改为相对路径即可。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- **backend-ai-api**：`/api/ai/chat` 增加 JWT 鉴权要求（使用现有 `jwtAuth`）；未鉴权请求需返回 401。
- **frontend-app**：Chat 的 `DefaultChatTransport` 需在请求中携带 `Authorization: Bearer <token>`；**去掉所有 `VITE_API_ORIGIN` 用法**，前端统一使用相对路径 `/api/...`，开发环境由 Vite 代理、生产环境由 nginx 代理（Vite 与 nginx 配置在 design 中说明）。

## Impact

- **后端**：AI 路由组或 chat 路由需挂载 `jwtAuth`，错误响应格式与现有统一响应一致。
- **前端**：Chat 页或 transport 构造处读取 token 并设置请求头；**移除所有 `VITE_API_ORIGIN` 用法**（`chat.tsx`、`home.tsx` 的 `API_ORIGIN` 及 `vite-env.d.ts` 声明），统一改为相对路径 `/api/...`；开发环境在 Vite 中配置 `/api` 代理到后端。
- **部署**：生产环境需在 nginx（或等效反向代理）中配置 `/api` 反向代理到后端服务。
