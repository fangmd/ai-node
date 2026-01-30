## Why

后端当前各接口返回体格式不统一（如 `{ ok, message }`、`{ status }`），前端难以用统一方式解析与错误处理。主 spec（backend-api）已约定统一响应格式 `{ code, msg, data }`，需要在本变更中落地实现并让所有路由使用。

## What Changes

- 新增 response 工具模块：封装成功/失败两种响应函数，统一返回 `{ code, msg, data }` 并设置对应 HTTP 状态码。
- 现有路由（如 `/`、`/health`）改为通过工具函数返回，使响应格式符合主 spec 约定。
- 不新增对外 API，不改变现有 URL 或方法，仅统一响应体结构。**BREAKING**：响应 JSON 结构变化，依赖旧格式的前端需改为解析 `code`/`msg`/`data`。

## Capabilities

### New Capabilities

（无。本变更为实现既有 backend-api 中「统一 API 响应格式」需求。）

### Modified Capabilities

- `backend-api`: 实现「统一 API 响应格式」要求中的工具函数与路由使用方式（spec 已定义，本变更为实现）。

## Impact

- **apps/backend/src**：新增 response 工具（如 `response.ts` 或 `utils/response.ts`），`index.ts` 中路由改为调用成功/失败响应函数。
- **前端**：若有直接解析当前后端 JSON 的代码，需改为按 `code`/`msg`/`data` 解析。
