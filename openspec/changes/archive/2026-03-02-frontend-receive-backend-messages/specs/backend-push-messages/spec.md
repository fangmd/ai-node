# backend-push-messages

## Purpose

基于 SSE 的后端到前端单向推送：后端通过单一 SSE 端点向已认证用户推送事件，前端通过 EventSource 订阅并按用户隔离接收。

## ADDED Requirements

### Requirement: SSE 端点

后端 SHALL 提供单一 GET SSE 端点（如 `/api/sse` 或 `/api/events`），响应 `Content-Type: text/event-stream`，保持长连接并按 SSE 规范写入事件行（`event` 与 `data`）。

#### Scenario: 客户端连接成功

- **WHEN** 已认证前端使用 EventSource 请求该端点
- **THEN** 后端返回 200 与 `Content-Type: text/event-stream`，连接保持打开

#### Scenario: 未认证请求被拒绝

- **WHEN** 未认证请求访问该端点
- **THEN** 后端返回 401（或现有鉴权约定的错误状态），不建立 SSE 流

### Requirement: 按用户隔离推送

后端 SHALL 按当前连接对应的已认证用户隔离事件流：仅向该连接推送属于该用户的事件，MUST 不向该连接推送其他用户的事件。

#### Scenario: 仅收到当前用户事件

- **WHEN** 用户 A 已建立 SSE 连接，服务端产生一条针对用户 A 的事件
- **THEN** 用户 A 的连接收到该事件

#### Scenario: 不收到其他用户事件

- **WHEN** 用户 A 已建立 SSE 连接，服务端产生一条针对用户 B 的事件
- **THEN** 用户 A 的连接不收到该事件；仅用户 B 的连接（若存在）收到

### Requirement: 事件格式

每条 SSE 事件 SHALL 包含：`event` 字段表示事件类型（如 `notification`、`state-update`）；`data` 字段为单行 JSON 字符串，表示 payload。具体事件类型与 data 结构由业务在实现中定义。

#### Scenario: 标准事件可解析

- **WHEN** 后端向连接写入一条 `event: notification` 与 `data: {"id":"1","title":"..."}` 的 SSE 消息
- **THEN** 前端 EventSource 可解析出 `type === 'notification'` 与 `data` 为对应 JSON 对象

### Requirement: 前端连接与消费

前端 SHALL 在需要接收推送的入口（如 App 或布局）建立到上述 SSE 端点的 EventSource 连接；连接 SHALL 使用与现有 API 一致的鉴权方式（如同源 Cookie）。前端 SHALL 提供统一的消息处理机制（如按 `event` 类型分发到处理函数或 React Context），并在应用/页面卸载时关闭连接。

#### Scenario: 建立连接并收到事件

- **WHEN** 用户已登录且前端创建 EventSource 指向 SSE 端点
- **THEN** 连接建立，后续后端推送的事件按类型被前端分发并消费

#### Scenario: 卸载时关闭连接

- **WHEN** 用户离开页面或应用卸载
- **THEN** 前端关闭 EventSource，不再接收新事件
