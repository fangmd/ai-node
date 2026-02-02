# Design: Frontend Login

## Context

- 前端为 React SPA（`apps/frontend`），使用 Vite、React Router（组件式路由）、Tailwind v4；已有 shadcn 基础（`components.json`、`components/ui/button.tsx`、`lib/utils.ts`），路由包含 `/`、`/about`、`/chat`。
- 后端已提供 user-auth：`POST /api/auth/login` 返回 `{ code: 200, data: { token } }`，受保护接口在 token 无效时返回 401 统一格式（如 `{ code: 401, msg: "Unauthorized" }`）。
- 当前前端无登录页、无 token 存储、无鉴权守卫；需在不改后端契约的前提下，在前端实现登录页、token 持久化、未登录跳转与 401 处理。

## Goals / Non-Goals

**Goals:**

- 提供登录页：用户名、密码表单，调用 `POST /api/auth/login`，成功后将 token 写入持久化存储并跳转至应用主界面（如 `/` 或 `/chat`）。
- 以「是否存有 token」作为已登录依据；访问需登录的路由时若无 token，重定向到登录页。
- 任意请求收到后端 401 时，清除 token 并重定向到登录页。
- 登录页使用 shadcn 组件（Button、Input、Card、Label 等），风格与现有 UI 一致。

**Non-Goals:**

- 不实现注册页、忘记密码、OAuth；不实现 refresh token 或服务端登出。
- 不修改后端 API 或 401 响应格式。

## Decisions

### 1. Token 存储：localStorage + 单一 key

- **选择**：使用 `localStorage` 存储 token，键名统一（如 `auth_token`），由工具函数封装读写与清除。
- **理由**：实现简单、刷新不丢；与「未登录 = 无 token」判定一致；无跨域共享需求，localStorage 足够。
- **备选**：sessionStorage 刷新即丢，不利于保持登录；Cookie 需后端 Set-Cookie 与 CORS 配置，当前后端未做。

### 2. 鉴权守卫：布局层 ProtectedRoute 或路由级包装

- **选择**：提供「受保护路由」包装组件（如 `ProtectedRoute`）：若无 token 则 `<Navigate to="/login" replace />`，有 token 则 `<Outlet />` 或渲染 children。需登录的路由（如 `/chat`）挂在该布局或包装下；登录页 `/login` 与公开页（如 `/`、`/about`）不包装。
- **理由**：与现有 React Router 组件式路由一致；逻辑集中、易测；不引入额外路由库。
- **备选**：在每条路由的 loader 里检查 token 会重复逻辑；全局单一路由表 + 配置式守卫需改现有路由结构，改动更大。

### 3. 401 处理：请求层统一拦截

- **选择**：在发起请求的入口统一处理 401：若使用 `fetch` 封装（如 `api.ts` 或 `request.ts`），在响应中检测 `res.status === 401`（或 `res.json().code === 401`），清除 token 并 `navigate('/login', { replace: true })`；若多处直接 `fetch`，先收敛到统一封装再在封装内处理 401。
- **理由**：一处实现、所有请求生效；与「token 失效即清空并跳转登录」一致。
- **备选**：在每个调用点处理 401 易遗漏且重复；依赖 React 组件内 navigate 时，可在封装内通过传入 `getNavigate()` 或使用 `useNavigate` 的 hook 包装获取 navigate。

### 4. 登录页路由与「已登录访问 /login」行为

- **选择**：登录页路由为 `/login`。若用户已登录（有 token）仍访问 `/login`，重定向到首页或默认进入页（如 `/` 或 `/chat`），避免重复登录。
- **理由**：体验一致、避免误留登录页。

### 5. shadcn 组件与登录页结构

- **选择**：登录页使用 shadcn 的 Card（容器）、CardHeader/CardTitle/CardContent、Label、Input、Button；表单校验可用 React 受控组件 + 提交时校验（必填、格式等），错误信息展示在表单项下方或 Card 内。
- **理由**：与现有 `components/ui` 风格一致；Card 提供清晰区块，Label+Input 符合无障碍与设计规范。

### 6. API 基地址与请求封装

- **选择**：继续使用现有 `VITE_API_ORIGIN`（或项目已有 env）作为 API 基地址；在封装请求时附加 `Authorization: Bearer ${getToken()}`（若存在 token），并在响应中处理 401。
- **理由**：与 frontend-app 现有「API base URL via env」一致；集中挂载 token 与 401 逻辑，避免散落。

## Risks / Trade-offs

| 风险 / 权衡 | 缓解 |
|------------|------|
| navigate 在非 React 上下文中不可用 | 401 处理放在使用 `useNavigate` 的封装层（如 hook 或提供 navigate 的 context），或通过 React Router 的 `createBrowserRouter`/router 对象以编程方式 navigate。 |
| 多 tab 下 token 清除不同步 | 接受单 tab 行为；可选后续用 `storage` 事件同步清除，本阶段不实现。 |
| 登录页与 chat 等样式不一致 | 明确使用 shadcn + 现有 Tailwind 主题，登录页仅复用 Card/Input/Button，不引入新设计系统。 |

## Migration Plan

- 前端增量发布：新增 `/login` 路由与登录页组件、token 工具、ProtectedRoute、请求封装 401 处理；将需保护的路由（如 `/chat`）包在 ProtectedRoute 下。
- 无数据迁移；若此前无 token，用户首次访问受保护路由会进入登录页，属预期行为。

## Open Questions

- 无。实现阶段若发现 chat 页或其他接口调用处尚未走统一请求封装，需先收敛到封装再加 401 处理。
