## 1. AI 路由分组

- [ ] 1.1 新建 `apps/backend/src/routes/ai.ts`，创建 Hono 子应用并导出
- [ ] 1.2 在 `apps/backend/src/index.ts` 中挂载 AI 子应用到 `/api/ai`

## 2. Hello 端点

- [ ] 2.1 在 AI 子应用中实现 `GET /hello`，使用现有 `success()` 返回统一成功格式
- [ ] 2.2 验证 `GET /api/ai/hello` 返回 `{ code: 200, msg: "success", data }` 且 HTTP 200
