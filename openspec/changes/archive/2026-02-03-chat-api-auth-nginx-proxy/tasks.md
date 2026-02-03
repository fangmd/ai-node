## 1. 后端 Chat 鉴权

- [x] 1.1 在 `POST /api/ai/chat` 路由上挂载 `jwtAuth` 中间件，未鉴权请求返回 401 且使用统一错误格式

## 2. 前端 Vite 代理与移除 VITE_API_ORIGIN

- [x] 2.1 在 `apps/frontend/vite.config.ts` 中配置 `server.proxy`：将 `/api` 代理到后端（如 `http://localhost:3000`）
- [x] 2.2 将 `apps/frontend/src/pages/chat.tsx` 中 `API_ORIGIN` 与 `CHAT_URL` 改为相对路径 `/api/ai/chat`
- [x] 2.3 将 `apps/frontend/src/pages/home.tsx` 中 `API_ORIGIN` 改为相对路径（如 `/api/` 或对应接口路径）
- [x] 2.4 从 `apps/frontend/src/vite-env.d.ts` 中移除 `VITE_API_ORIGIN` 类型声明

## 3. 前端 Chat 请求头鉴权

- [x] 3.1 在 Chat 页创建 DefaultChatTransport 时传入 `headers`：从 `getToken()` 读取 token，若有则设置 `Authorization: Bearer <token>`

## 4. 文档

- [x] 4.1 更新 README：移除对 `VITE_API_ORIGIN` 的说明，补充开发环境（Vite 代理 `/api`）与生产环境（nginx 代理 `/api`）的配置说明
- [x] 4.2 若存在 `apps/frontend/.env.example` 中对 `VITE_API_ORIGIN` 的说明，则移除
