## 1. Response 工具模块

- [x] 1.1 在 `apps/backend/src` 下新增 response 工具文件（如 `response.ts`），定义统一响应体类型 `{ code, msg, data }`
- [x] 1.2 实现成功响应函数：接收 Hono Context 与可选 `data`，返回 `c.json({ code: 200, msg: "success", data: data ?? {} }, 200)`
- [x] 1.3 实现失败响应函数：接收 Hono Context、`code`、`msg`、可选 `data`，返回 `c.json({ code, msg, data: data ?? {} }, code)`（或与 HTTP 状态码一致的逻辑）

## 2. 路由改用工具函数

- [x] 2.1 将 `index.ts` 中 `/` 路由改为使用成功 response 工具返回（如 `{ message: "Hello from Hono" }` 放入 `data`）
- [x] 2.2 将 `index.ts` 中 `/health` 路由改为使用成功 response 工具返回（如 `{ status: "ok" }` 放入 `data`）

## 3. 验证

- [x] 3.1 本地请求 `GET /`、`GET /health`，确认响应体为 `{ code: 200, msg: "success", data: ... }` 且 HTTP 状态码为 200
