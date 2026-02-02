# Proposal: 后端增加 MySQL（Prisma）

## Why

后端目前无持久化能力，业务数据无法落库。引入 MySQL 并通过 Prisma ORM 连接，可将数据库连接与配置统一放在 env 中管理，为后续业务表与数据持久化提供基础。

## What Changes

- 在 backend 中引入 Prisma，使用 MySQL 作为数据源。
- 数据库连接信息全部通过环境变量配置（`DATABASE_URL` 等），不写死在代码中。
- 连接目标：主机 `39.106.7.10`，端口 `13306`，数据库名 `devai`；Prisma 连接串格式为 `mysql://USER:PASSWORD@39.106.7.10:13306/devai`，其中 USER、PASSWORD 由 env 提供。
- 在 backend 的 `.env.example` 中增加 `DATABASE_URL` 示例，便于本地与部署环境配置。

## Capabilities

### New Capabilities

- **backend-mysql-prisma**：后端通过 Prisma 连接 MySQL，连接与配置由 env 管理；包含 schema 占位与 client 初始化，为后续业务表扩展预留能力。

### Modified Capabilities

- 无。本次仅增加数据库基础设施，不改变现有 API 或前端行为。

## Impact

- **apps/backend**：新增 Prisma 依赖与 `prisma/schema.prisma`，增加 `DATABASE_URL` 等 env 配置；需在应用启动或首次使用前确保 Prisma Client 可用（如 `prisma generate`）。
- **依赖**：backend 新增 `@prisma/client`、`prisma`（dev）。
- **部署/运维**：需在运行环境中配置 `DATABASE_URL`（或等价拆分为 HOST/PORT/DB/USER/PASSWORD 再组装）。
