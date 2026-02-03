## 1. 错误模块（统一定义业务报错）

- [x] 1.1 新增 `apps/backend/src/errors/app-error.ts`：定义 `AppError` 类（code, message, 可选 data, 可选 cause），并导出 `isAppError()` type guard
- [x] 1.2 新增 `apps/backend/src/errors/errors.ts`（或 `index.ts`）：实现工厂函数 `badRequest()`, `unauthorized()`, `notFound()`, `conflict()`, `serviceUnavailable()`, `validationError(msg?, issues?)`（validation 类型带可选 issues），统一从本模块导出

## 2. 响应工具

- [x] 2.1 修改 `apps/backend/src/response.ts`：确保 `fail(c, code, msg, data)` 显式返回 HTTP status 200（如 `c.json({ code, msg, data: data ?? {} }, 200)`）

## 3. 全局错误处理

- [x] 3.1 在 `apps/backend/src/index.ts` 添加 `app.onError`：根据错误类型映射为统一响应（AppError → 其 code/msg/data；ZodError → 400 + type: "validation"；未知 → 500），均通过 `fail()` 返回 HTTP 200
- [x] 3.2 在 `apps/backend/src/index.ts` 添加 `app.notFound`：返回统一格式（code 404, msg 友好提示），HTTP 200

## 4. 迁移调用点

- [x] 4.1 修改 `apps/backend/src/auth/middleware.ts`：鉴权失败时改为 `throw unauthorized()`，不再直接 `return c.json(...)`
- [x] 4.2 修改 `apps/backend/src/routes/auth.ts`：Zod 校验失败时改为抛出 `validationError`（或由全局 onError 识别 ZodError 并转换），业务失败改为 `throw` 对应 AppError（可选，或保留现有 `return fail(...)`）
- [x] 4.3 修改 `apps/backend/src/routes/ai.ts`：chat 异常改为 `throw`（如 `serviceUnavailable()` 用于配置缺失、通用 500 用于未知），移除冗余 try/catch 中重复的 fail 逻辑

## 5. 验证

- [x] 5.1 验证 auth 注册/登录、me、ai/chat 在 400/401/409/503 等场景下返回统一格式且 HTTP status 为 200；Zod 校验失败时 `data.type === "validation"`
