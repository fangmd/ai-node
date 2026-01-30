# backend-api

## Purpose

Hono-based backend application: entry, routes, CORS, Vite build, and monorepo integration.

## Requirements

### Requirement: Hono app entry
The backend SHALL be a Hono application. The app MUST have an entry file (e.g. `src/index.ts`) that creates a Hono instance, attaches routes and CORS, and listens on a configurable port (default 3000).

#### Scenario: server listens
- **WHEN** the backend is started (dev or production)
- **THEN** the HTTP server listens on the configured port and responds to requests

### Requirement: CORS for frontend dev
The backend SHALL enable CORS in development so that the frontend dev server (e.g. origin `http://localhost:5173`) can call the API. CORS MAY be implemented via Hono middleware or built-in options.

#### Scenario: cross-origin request from frontend
- **WHEN** the frontend dev app sends a request to the backend API
- **THEN** the backend responds with appropriate CORS headers and the browser allows the response

### Requirement: Vite build for backend
The backend SHALL be built with Vite. Build MUST produce a Node-runnable bundle (e.g. single file or entry). The package MUST have `dev` and `build` scripts; `dev` SHALL run the app in development (e.g. vite-node or Vite dev server for Node); `build` SHALL run Vite build with Node target.

#### Scenario: build output runnable
- **WHEN** user runs the backend's `build` script
- **THEN** output can be run with `node` and the server starts correctly

### Requirement: backend in apps directory
The backend SHALL live under `apps/backend`. It MUST be a workspace package with its own `package.json` and MUST be included in the Turborepo pipeline.

#### Scenario: turbo runs backend tasks
- **WHEN** user runs `turbo run build` or `turbo run dev` from root
- **THEN** the backend package is included and its scripts are executed

### Requirement: 统一 API 响应格式
后端 API 的 HTTP 响应体 SHALL 使用统一格式，便于前端解析与错误处理。

#### 响应体结构
- **code** (number): HTTP 状态码或业务状态码，成功为 200
- **msg** (string): 描述信息，成功时为 `"success"`，失败时为错误描述
- **data** (object): 业务数据，成功时返回实际数据，失败时可为空对象或错误详情

示例（成功）:
```json
{
  "code": 200,
  "msg": "success",
  "data": {}
}
```

示例（失败）:
```json
{
  "code": 400,
  "msg": "Bad Request",
  "data": {}
}
```

#### 工具函数
- 后端 SHALL 提供封装好的 response 工具函数，供所有路由统一使用
- **成功响应**: 接收 `data`（可选），返回 `{ code: 200, msg: "success", data }` 并设置 HTTP 状态码
- **失败响应**: 接收 `code`（或 HTTP 状态码）、`msg`、可选 `data`，返回统一格式并设置对应 HTTP 状态码
- 路由处理程序 SHOULD 通过工具函数返回响应，而不是手写 JSON 对象，以保证格式一致

#### Scenario: 成功响应格式
- **GIVEN** 某 API 处理成功
- **WHEN** 使用成功 response 工具函数返回
- **THEN** 响应体为 `{ code: 200, msg: "success", data: <业务数据> }`，HTTP 状态码为 200

#### Scenario: 失败响应格式
- **GIVEN** 某 API 处理失败（如参数错误、未授权、服务异常）
- **WHEN** 使用失败 response 工具函数返回
- **THEN** 响应体为 `{ code: <错误码>, msg: "<错误描述>", data: {} }`，HTTP 状态码与业务约定一致
