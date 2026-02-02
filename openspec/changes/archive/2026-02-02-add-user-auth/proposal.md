# Proposal: add-user-auth

## Why

后端需要用户身份与访问控制，以便区分已登录用户并保护需要鉴权的接口。当前仅支持匿名访问，无法支持「用户登录/注册」和「需登录才能访问」的能力。本变更在现有 Hono + Prisma/MySQL 基础上，增加基于用户名密码的注册/登录与 JWT 鉴权。

## What Changes

- **用户表与存储**：在 Prisma schema 中新增 User 模型，仅支持「用户名 + 密码」；密码存储使用安全哈希（如 bcrypt），不存明文。数据库迁移由使用方自行执行。
- **注册与登录 API**：提供注册（用户名 + 密码）和登录（用户名 + 密码）接口；登录成功返回 JWT token，客户端后续在请求头中携带该 token。
- **JWT 方案**：token 采用 JWT，服务端签发与校验；需配置密钥（如 `JWT_SECRET`）及可选过期时间。
- **Hono JWT 中间件**：在 Hono 中增加 JWT 校验中间件，对需要保护的路由进行鉴权；校验失败返回 401，成功则将用户信息注入上下文供后续使用。

## Capabilities

### New Capabilities

- **user-auth**：用户认证能力。覆盖用户表设计（用户名、密码哈希）、注册/登录 API 契约、JWT 签发与校验、Hono JWT 中间件行为及受保护路由的鉴权约定。

### Modified Capabilities

- （无。backend-api、backend-mysql-prisma 等现有 spec 的既有要求不变；本变更通过新增 user-auth 能力扩展后端行为。）

## Impact

- **代码**：`apps/backend` 新增/修改：Prisma schema（User 模型）、认证相关路由（如 `/auth/register`、`/auth/login`）、JWT 工具与 Hono 中间件、以及依赖 JWT 的受保护路由挂载方式。
- **依赖**：后端新增 JWT 库（如 `jose` 或 `jsonwebtoken`）及密码哈希库（如 `bcrypt` 或 `argon2`）。
- **配置**：需在环境变量中增加 `JWT_SECRET`（及可选的 token 过期时间等），并在 `.env.example` 中说明。
- **数据库**：本变更仅提供 Prisma schema 中的 User 模型定义；迁移（创建 User 表）由使用方自行执行（如 `prisma migrate`）。
