## 1. 后端 SSE 端点与鉴权

- [x] 1.1 新增 GET SSE 路由（如 `/api/sse`），返回 `Content-Type: text/event-stream` 并保持长连接
- [x] 1.2 在 SSE 路由中接入现有鉴权：未认证返回 401，不建立流
- [x] 1.3 实现按用户隔离：为每个已认证连接绑定当前用户标识，仅向该连接写入属于该用户的事件

## 2. 后端事件推送能力

- [x] 2.1 实现服务端向指定用户推送事件的机制（如按 userId 注册的写入器或 channel，可写入 `event` + `data` JSON 行）
- [x] 2.2 约定并实现至少一种示例事件格式（如 `event` 类型名 + `data` 单行 JSON），供前端解析

## 3. 前端连接与 Context

- [x] 3.1 配置 SSE 端点 URL（与现有 API 同源或使用同一 base URL）
- [x] 3.2 实现创建 EventSource 连接（同源带 Cookie），并按 `event` 类型解析 `data` JSON
- [x] 3.3 提供 React Context（或 hook），暴露连接状态与按事件类型分发的消息，供组件订阅
- [x] 3.4 在 App 或根布局挂载 SSE 连接，在应用/页面卸载时关闭 EventSource
