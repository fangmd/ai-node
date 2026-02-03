# Design: add-user-auth

## Context

- 后端为 Hono 应用（`apps/backend`），已有 CORS、统一响应格式、路由 `/`、`/health`、`/api/ai`；数据层使用 Prisma + MySQL，单例 Client，schema 位于 `prisma/schema.prisma`。
- 当前无用户与鉴权能力，需在不动现有 API 契约的前提下新增「用户注册/登录 + JWT 鉴权 + 受保护路由」的实现路径。
- 约束：仅支持用户名+密码；数据库迁移由使用方自行执行，本设计不包含迁移脚本或自动化部署。

## Goals / Non-Goals

**Goals:**

- 在 Prisma schema 中定义 User 模型（id 为 BigInt、由 Snowflake 生成；用户名、密码哈希；通用字段 create_time、update_time），与现有 Placeholder 等模型共存。
- 提供注册、登录 HTTP 接口；登录成功返回 JWT，客户端通过 `Authorization: Bearer <token>` 携带。
- 使用 JWT 签发与校验 token，配置 `JWT_SECRET`（及可选过期时间）。
- 提供 Hono 中间件：校验 JWT、失败 401、成功将用户信息写入 Hono context，供受保护路由使用。

**Non-Goals:**

- 不执行数据库迁移（仅提供 schema 定义）。
- 不做 refresh token、登出黑名单、OAuth/第三方登录。
- 不在本设计中约定具体「受保护路由」列表，仅约定中间件行为与上下文形状。

## Decisions

### 1. JWT 库：jose

- **选择**：使用 `jose` 进行 JWT 的 sign/verify。
- **理由**：轻量、ESM 友好、无 Node 内置依赖，与当前 Vite/ESM 后端一致；API 简洁（`SignJWT`、`jwtVerify`）。
- **备选**：`jsonwebtoken` 更常见但依赖 Node `crypto` 与回调风格，在 ESM 下略繁琐。

### 2. 密码哈希：bcrypt

- **选择**：使用 `bcrypt`（或 `bcryptjs` 纯 JS 实现）对密码做哈希后入库。
- **理由**：广泛使用、盐值内置、与现有 Node 生态兼容；本场景无合规强需求，bcrypt 足够。
- **备选**：argon2 更抗 GPU 破解，但依赖原生模块，部署与兼容性成本略高；后续若有安全升级需求可再换。

### 3. User 模型字段

- **选择**：`id`（主键、BigInt、由 Snowflake 生成）、`username`（唯一、非空）、`passwordHash`（非空）、`create_time`（创建时间）、`update_time`（更新时间）。
- **理由**：满足「仅用户名+密码」；不存明文密码；唯一索引保证用户名唯一；id 使用 Snowflake 与现有后端 `common/snowflake.ts` 一致，BigInt 避免溢出；create_time/update_time 为数据库通用审计字段。
- **实现要点**：Prisma 中 `id` 为 `BigInt`，注册时调用现有 `generateUUID()` 生成，不设 `@default(autoincrement())`；`username` 加 `@unique`；`passwordHash` 建议 `String` 长度足够（如 255）；`create_time`、`update_time` 为 `DateTime`，创建时写入、更新时刷新。

### 4. JWT Payload 与上下文

- **选择**：Payload 仅包含当前需求的最小集，如 `sub`（用户 id）、`username`；过期时间由 `JWT_SECRET` 同目录下的配置（如 `JWT_EXPIRES_IN`）决定，默认可选 7d。
- **理由**：减少 token 体积与泄露信息；`sub` 与现有 User.id 对应，便于中间件内查库或仅信任 token。
- **中间件**：从 `Authorization` 取 Bearer token → jose 校验 → 将 `{ id, username }`（或等价）写入 `c.get('user')`（或项目约定变量），供路由使用；校验失败返回 401 + 统一响应格式。

### 5. 路由与目录结构

- **选择**：认证路由集中挂载，如 `app.route('/api/auth', authRoutes)`；auth 路由内部分别实现 `POST /register`、`POST /login`；JWT 工具与中间件放在 `auth` 相关模块（如 `auth/jwt.ts`、`auth/middleware.ts`），便于复用与测试。
- **理由**：与现有 `app.route('/api/ai', ai)` 风格一致；认证逻辑内聚，后续加 refresh 或 logout 可同目录扩展。

## Risks / Trade-offs

| 风险 / 权衡           | 缓解                                                                   |
| --------------------- | ---------------------------------------------------------------------- |
| JWT_SECRET 弱或泄露   | 文档与 .env.example 中明确要求强随机、生产环境独立密钥；不提供默认值。 |
| 无服务端登出 / 黑名单 | 接受「token 在过期前始终有效」；若后续需要可再设计 refresh 或黑名单。  |
| bcrypt 同步阻塞       | 注册/登录为低频操作，可接受；若压测出现瓶颈再考虑异步或 worker。       |

## Migration Plan

- **交付物**：仅 Prisma schema 中新增/修改 User 模型；不包含 `prisma migrate` 的自动执行。
- **使用方**：在目标环境执行 `prisma migrate dev`（或生产流程中的 migrate）创建/更新表；本变更不定义部署或回滚步骤。

## Open Questions

- Token 默认过期时间（如 7d）是否在实现阶段在配置中写死，还是全部由环境变量决定：建议实现时采用 `JWT_EXPIRES_IN` 可选，未设置时使用合理默认（如 `7d`）。
