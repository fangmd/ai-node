## Context

- **现状**：前端仅能通过请求-响应或轮询获取数据，无后端主动推送能力。
- **技术栈**：后端 Hono（Node），前端 React + Vite；同源或通过现有 API 基地址访问。
- **约束**：不引入新外部依赖，基于现有 HTTP 栈；单向推送即可，无需通过该通道回写业务数据。

## Goals / Non-Goals

**Goals:**

- 后端通过 SSE 向前端推送事件，前端用 `EventSource` 订阅并消费。
- 约定统一的事件类型与 payload 结构，便于扩展（如通知、状态更新）。
- 前端提供可复用的订阅与消息处理（如 hook/context），与现有 React 集成。

**Non-Goals:**

- 不实现双向通信（若需可后续引入 WebSocket）。
- 不在此设计中规定具体业务事件类型，由 specs / 实现阶段定义。

## Decisions

### 1. 传输协议：SSE（Server-Sent Events）

- **选择**：使用 SSE，前端 `EventSource`，后端返回 `text/event-stream` 流。
- **理由**：单向推送场景足够、基于 HTTP 易部署、浏览器原生支持且自动重连。
- **备选**：WebSocket（需双向或更高频时再考虑）；长轮询（兼容性兜底，暂不采用）。

### 2. 后端 SSE 端点与流格式

- **选择**：新增单一 SSE 端点（如 `GET /api/sse` 或 `/api/events`），响应 `Content-Type: text/event-stream`，按行写入 `event` + `data`（JSON）。
- **理由**：一个连接承载多类事件，通过 `event` 字段区分类型，`data` 为 JSON 便于前后端共享结构。
- **备选**：多端点按业务拆分（增加维护成本，当前不采纳）。

### 3. 前端连接与生命周期

- **选择**：在需要接收推送的入口（如 App 或布局）建立单例 EventSource，通过 React Context 或全局事件总线向组件分发消息；页面/应用卸载时关闭连接。
- **理由**：避免多 tab 多连接时重复推送与资源浪费；Context 与现有 React 数据流一致。
- **备选**：每页独立连接（可后续按需优化为按路由/权限建立）。

### 4. 鉴权与跨域

- **选择**：SSE 连接使用与现有 API 一致的鉴权方式（如 Cookie 或同一 Origin）；若需携带 token，可用查询参数在建立连接时传入（注意 URL 暴露，优先同源 + Cookie）。
- **理由**：EventSource 标准不支持自定义 Header，同源 + Cookie 最简；跨域时再考虑 query token 或代理。
- **备选**：使用 fetch + ReadableStream 模拟 SSE 以支持 Header（实现复杂，当前不采纳）。

## Risks / Trade-offs

| 风险 / 取舍 | 缓解 |
|-------------|------|
| 长连接占用后端资源 | 合理超时与最大连接数；后续可加心跳与空闲断开策略。 |
| EventSource 无法带自定义 Header | 同源 + Cookie 鉴权；必要时用 query 参数并控制有效期。 |
| 多 tab 各建连接 | 先单 tab 单连接；后续可考虑 SharedWorker 或服务端按用户去重。 |
| 断线重连与消息遗漏 | 依赖 EventSource 自动重连；重要状态仍以接口查询为准，推送作增量提示。 |

## Migration Plan

- **部署**：先上线后端 SSE 端点（兼容无客户端连接）；再上线前端订阅与处理逻辑，未连接时功能降级为无推送。
- **回滚**：关闭前端 EventSource 建立即可回退前端；后端保留端点不影响现有 API。

## Open Questions

- 无。按用户隔离事件流已确定为需求：仅向当前已认证用户连接推送该用户的事件，见 `backend-push-messages` spec。
