## 1. 依赖与配置

- [x] 1.1 在 backend 的 package.json 中添加 jose 和 bcrypt（或 bcryptjs）
- [x] 1.2 在 env 或配置中增加 JWT_SECRET、JWT_EXPIRES_IN（可选）的读取，并在 .env.example 中说明

## 2. 数据模型

- [x] 2.1 在 Prisma schema 中新增 User 模型：id (BigInt 主键)、username (@unique)、passwordHash、create_time、update_time (DateTime)
- [x] 2.2 注册时使用现有 generateUUID() 生成 id，写入 create_time/update_time

## 3. JWT 与密码工具

- [x] 3.1 实现 JWT 签发：读取 JWT_SECRET 与 JWT_EXPIRES_IN，使用 jose 生成 payload 含 sub、username 的 token
- [x] 3.2 实现 JWT 校验：解析 Authorization Bearer token，使用 jose 校验并返回 payload
- [x] 3.3 实现密码哈希与校验：使用 bcrypt 对密码哈希、校验明文与哈希是否匹配

## 4. Hono JWT 中间件

- [x] 4.1 实现 Hono 中间件：从 Authorization 取 Bearer token，调用 JWT 校验，成功则将 { id, username } 写入 c.set('user', ...)，失败则返回 401 及统一响应格式

## 5. 认证路由

- [x] 5.1 实现 POST /api/auth/register：校验 username/password 入参，检查用户名唯一，哈希密码后创建 User，返回成功或错误（如用户名已存在）
- [x] 5.2 实现 POST /api/auth/login：根据 username 查 User，校验密码，成功则签发 JWT 并返回（如 data.token）

## 6. 集成

- [x] 6.1 在 index 中挂载认证路由：app.route('/api/auth', authRoutes)
- [x] 6.2 将受保护路由示例或文档说明：对需要鉴权的路由使用 JWT 中间件并从 c.get('user') 读取用户信息
