# Proposal: Frontend Login

## Why

后端已具备用户认证能力（user-auth：注册、登录、JWT 签发与校验），前端目前无登录入口与鉴权保护。需要在前端实现登录页面与基于 token 的访问控制，使未登录用户被引导至登录页，并在 token 失效时自动清除并跳转，与现有后端 API 对齐。

## What Changes

- 实现**登录页面**：提供用户名、密码表单，调用 `POST /api/auth/login`，成功后将后端返回的 token 持久化（如 localStorage），并跳转到应用主界面。
- **未登录判定与跳转**：以「是否存有 token」作为已登录依据；访问需登录的页面时若未存 token，则重定向到登录页。
- **Token 失效处理**：当任意请求收到后端 401（如 token 过期或无效）时，前端清除已存储的 token 并重定向到登录页。
- 登录页使用 **shadcn/ui** 组件与现有设计规范，保持与项目风格一致。

## Capabilities

### New Capabilities

- `frontend-login`: 前端登录能力。包含：登录页（shadcn 表单与样式）、token 存储与读取、路由级「未登录则跳转登录页」、全局或请求层对 401 的响应（清除 token 并跳转登录页）。

### Modified Capabilities

- （无。后端 user-auth 与 frontend-app 的既有需求不变；本变更仅在前端新增登录与鉴权行为，通过新能力 `frontend-login` 描述。）

## Impact

- **前端应用**（`apps/frontend`）：新增登录页路由与组件、token 存储工具、路由守卫或布局层鉴权逻辑、请求拦截或统一错误处理以响应 401。
- **依赖**：需使用或已使用 shadcn/ui 相关组件（Button、Input、Card、Label 等）；若尚未集成 shadcn，需在 frontend 中配置。
- **与后端**：依赖现有 `POST /api/auth/login` 与统一 401 响应格式（如 `{ code: 401, msg: "Unauthorized", ... }`），无需改后端 API。
