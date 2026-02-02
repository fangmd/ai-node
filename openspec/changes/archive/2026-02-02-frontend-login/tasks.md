## 1. Token 存储

- [x] 1.1 实现 token 工具（如 `lib/auth.ts` 或 `lib/token.ts`）：getToken、setToken、clearToken，使用 localStorage 固定 key（如 `auth_token`）

## 2. shadcn 组件

- [x] 2.1 若尚未存在，添加 shadcn Card（CardHeader、CardTitle、CardContent）、Input、Label 组件
- [x] 2.2 确保登录页可复用现有 Button 与上述组件

## 3. 请求封装与 401 处理

- [x] 3.1 实现统一请求封装（如 `lib/api.ts`）：使用 VITE_API_ORIGIN 作为 base URL，请求时若 getToken() 非空则附加 `Authorization: Bearer <token>`
- [x] 3.2 在请求封装中处理 401：当响应 status === 401 或 body.code === 401 时调用 clearToken() 并跳转至 `/login`（replace）；navigate 通过依赖注入或在使用封装的上下文中提供（如 hook 内 useNavigate）

## 4. 受保护路由守卫

- [x] 4.1 实现 ProtectedRoute 组件：无 token 时渲染 `<Navigate to="/login" replace />`，有 token 时渲染 `<Outlet />` 或 children
- [x] 4.2 将需登录的路由（如 `/chat`）挂载在 ProtectedRoute 下（布局或路由配置）

## 5. 登录页

- [x] 5.1 实现登录页组件：Card 容器，用户名、密码 Input，Label，提交 Button；受控表单与提交时校验（必填等）
- [x] 5.2 提交时调用 POST /api/auth/login，成功则 setToken(data.token) 并 navigate 到主界面（如 `/` 或 `/chat`）；失败则展示错误信息不跳转
- [x] 5.3 若已登录（有 token）访问 `/login`，重定向到主界面（如 `/` 或 `/chat`）

## 6. 路由集成

- [x] 6.1 在 App 或路由配置中新增 `/login` 路由，对应登录页组件
- [x] 6.2 将 `/chat`（及后续需保护的路由）包在 ProtectedRoute 下；确保 `/login` 在未保护侧，且已登录访问 `/login` 时重定向
