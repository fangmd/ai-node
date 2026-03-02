## Why

目前前端只能通过请求-响应或轮询获取数据，无法接收后端主动推送。需要支持后端主动向前端推送消息（如通知、实时状态更新），以提升实时性与用户体验。

## What Changes

- 采用 **SSE（Server-Sent Events）** 实现后端到前端的单向推送：前端通过 `EventSource` 连接后端 SSE 端点，后端在长连接上持续推送事件。
- 增加后端到前端的单向消息通道，后端可主动推送消息，前端订阅并消费。
- 前端提供统一的订阅与消息处理机制（如事件类型、payload 结构）。
- 不要求前端向该通道回写业务数据（若需双向通信可后续扩展）。

## Capabilities

### New Capabilities

- `backend-push-messages`: 基于 SSE 定义后端推送（SSE 端点、事件流格式与类型）、消息/事件格式，以及前端如何通过 EventSource 建立连接、订阅与处理这些消息。

### Modified Capabilities

- （无：本次仅新增能力，不改变现有 frontend-app / backend-api 等已有需求。）

## Impact

- **前端**：新增连接/订阅逻辑与消息处理（如 React 层 hook 或 context），可能新增少量共享类型。
- **后端**：新增 SSE 端点与事件流写入逻辑，以及服务端触发推送的调用点。
- **依赖**：无新增外部依赖，基于现有 HTTP 栈即可。
