## MODIFIED Requirements

### Requirement: 统一 API 响应格式
后端 API 的 HTTP 响应体 SHALL 使用统一格式，便于前端解析与错误处理。

#### 响应体结构
- **code** (number): 业务状态码，成功为 200；失败使用 4xx/5xx 等错误码（用于表达错误语义）
- **msg** (string): 描述信息，成功时为 `"success"`，失败时为错误描述
- **data** (object): 业务数据，成功时返回实际数据；失败时返回提示类型或错误详情（可为空对象）

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
  "msg": "Invalid parameters",
  "data": { "type": "validation" }
}
```

#### 工具函数
- 后端 SHALL 提供封装好的 response 工具函数，供所有路由统一使用
- **成功响应**: 接收 `data`（可选），返回 `{ code: 200, msg: "success", data }` 并设置 HTTP 状态码为 200
- **失败响应**: 接收 `code`、`msg`、可选 `data`，返回统一格式；**业务报错的 HTTP 状态码 MUST 为 200**，错误语义由响应体 `code` 表达
- 路由处理程序 SHOULD 通过工具函数返回响应，而不是手写 JSON 对象，以保证格式一致

#### Scenario: 成功响应格式
- **GIVEN** 某 API 处理成功
- **WHEN** 使用成功 response 工具函数返回
- **THEN** 响应体为 `{ code: 200, msg: "success", data: <业务数据> }`，HTTP 状态码为 200

#### Scenario: 失败响应格式（HTTP 200）
- **GIVEN** 某 API 处理失败（如参数错误、未授权、服务异常）
- **WHEN** 使用失败 response 工具函数返回
- **THEN** 响应体为 `{ code: <错误码>, msg: "<错误描述>", data: {} }`，HTTP 状态码为 200

#### Scenario: 参数校验失败返回 validation 提示类型
- **GIVEN** 某 API 请求参数或 body 校验失败（例如 Zod 校验失败）
- **WHEN** 后端返回失败响应
- **THEN** 响应体 `code` 为 400，`msg` 为可直接展示的提示文案（例如 `"Invalid parameters"` / `"参数错误"`），且 `data.type` 为 `"validation"`（并可选携带精简后的 `issues` 列表）
