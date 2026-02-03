## Context

- Chat API `POST /api/ai/chat` 当前未鉴权；后端已有 `jwtAuth` 中间件并用于 `/api/me`。
- 前端部分页面（如 `chat.tsx`、`home.tsx`）使用 `VITE_API_ORIGIN` 拼绝对 URL 请求后端；`lib/api.ts` 已使用相对路径。
- 目标：为 chat 接口加 JWT 鉴权，前端统一相对路径，开发用 Vite 代理、生产用 nginx 代理，去掉所有 `VITE_API_ORIGIN`。

## Goals / Non-Goals

**Goals:**

- `/api/ai/chat` 要求有效 JWT，未鉴权返回 401。
- 前端 Chat 的 DefaultChatTransport 请求头带 `Authorization: Bearer <token>`。
- 前端所有 API 请求使用相对路径 `/api/...`；开发环境 Vite 代理 `/api` 到后端，生产环境 nginx 代理；移除 `VITE_API_ORIGIN` 及相关类型声明。

**Non-Goals:**

- 不新增登录/注册流程；不改变现有 JWT 签发与校验逻辑。
- 不在本变更内实现会话持久化或会话列表。

## Decisions

### 1. Chat 路由鉴权方式

- **选择**：在挂载 `/api/ai` 的 AI 子应用上，对 chat 路由（或整个 AI 组）使用现有 `jwtAuth` 中间件，与 `/api/me` 一致。
- **备选**：单独为 chat 写中间件 → 不采纳，复用 `jwtAuth` 更简单。
- **实现要点**：在 `apps/backend` 中，使 `POST /api/ai/chat` 经过 `jwtAuth`；401 时返回统一 JSON 格式（与现有后端一致）。

### 2. 前端 API 基地址与代理

- **选择**：不再使用 `VITE_API_ORIGIN`。前端所有请求使用相对路径（如 `/api/ai/chat`、`/api/me`）。开发环境在 Vite 中配置 `server.proxy`: 将 `/api` 代理到后端（如 `http://localhost:3000`）；生产环境由 nginx 将 `/api` 反向代理到后端。
- **备选**：保留 `VITE_API_ORIGIN` 仅生产使用 → 不采纳，与“统一去掉”目标一致地全部移除。
- **实现要点**：
  - **Vite**：在 `apps/frontend/vite.config.ts` 中配置 `server.proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } }`（或项目现有后端 dev URL）。
  - **Nginx**：生产配置示例 `location /api { proxy_pass http://backend_upstream; proxy_http_version 1.1; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }`，具体 upstream 名与端口按部署环境填写。

### 3. Chat Transport 携带 Token

- **选择**：在创建 DefaultChatTransport 时传入 `headers`（或等效选项），从现有 token 存储（如 `getToken()` from `lib/auth`) 读取并设置 `Authorization: Bearer <token>`；无 token 时可不带该头（后端将返回 401，前端可按现有逻辑处理）。
- **实现要点**：仅修改 Chat 页或 transport 构造处，不改变 auth 库接口。

## Risks / Trade-offs

- **[Risk]** 未登录用户访问 Chat 页会收到 401，需前端有合理提示或引导登录。  
  **Mitigation**：沿用现有 401 处理（如 `lib/api.ts` 的 onUnauthorized）；可选在 Chat 页根据 `getToken()` 为空时提示先登录。

- **[Risk]** 生产部署若未配置 nginx 代理，前端请求 `/api` 会打到前端静态服务器导致 404。  
  **Mitigation**：在 README 或部署文档中明确写出 nginx（或等效）的 `/api` 代理配置步骤。

## Migration Plan

1. **后端**：为 `/api/ai/chat` 加上 `jwtAuth`，确认 401 响应格式统一。
2. **前端**：在 Vite 中配置 `/api` 代理；将 `chat.tsx`、`home.tsx` 中 `API_ORIGIN` 改为相对路径（如 `/api/ai/chat`、`/api/`）；Chat transport 增加 `Authorization: Bearer <token>`；删除 `vite-env.d.ts` 中 `VITE_API_ORIGIN` 声明。
3. **文档**：更新 README/.env.example，移除对 `VITE_API_ORIGIN` 的说明；补充开发（Vite 代理）与生产（nginx 代理）的说明。
4. **回滚**：后端去掉 chat 路由上的 `jwtAuth` 即可恢复未鉴权；前端恢复 `API_ORIGIN` 及类型声明并还原 Vite 配置即可回退（一般不推荐）。

## Open Questions

- 无。若后续需要“未登录时自动跳转登录页”，可在前端 401 处理或路由守卫中实现，不属本变更范围。
