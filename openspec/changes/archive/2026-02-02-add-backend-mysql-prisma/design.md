# Design: 后端 MySQL（Prisma）

## Context

- 后端（apps/backend）当前无数据库层，仅提供 AI 相关 API；需引入持久化能力以支撑后续业务数据落库。
- 数据库目标：MySQL，连接信息 `39.106.7.10:13306`，库名 `devai`；连接与认证全部通过环境变量配置，不写死在代码中。
- 约束：使用 Prisma 作为 ORM，保持与现有 Hono/Vite/TS 技术栈一致；改动限于 backend，不涉及 frontend 或共享类型的行为变更。

## Goals / Non-Goals

**Goals:**

- 在 backend 中接入 Prisma，使用 MySQL 作为 datasource，连接串由 `DATABASE_URL` 提供。
- 在 `.env.example` 中增加 `DATABASE_URL` 示例（含目标 host/port/db），便于本地与部署配置。
- 提供最小可用的 `schema.prisma`（如占位 model 或空 schema）与 Prisma Client 单例/初始化方式，为后续业务表扩展预留入口。

**Non-Goals:**

- 本次不定义具体业务表结构、不实现业务 CRUD API。
- 不迁移或改造现有 API 行为；不涉及 PlanetScale / relation mode 等特殊配置，除非后续明确需求。

## Decisions

1. **ORM 选型：Prisma**
   - 理由：类型安全、迁移与 schema 管理清晰、与 Node/TS 生态一致；文档与社区成熟。
   - 备选：TypeORM、Drizzle 等；当前选择 Prisma 以与 proposal 一致并简化上手。

2. **连接配置：单一 `DATABASE_URL`**
   - 理由：Prisma 标准用法，便于本地与各类部署环境（含 Docker、云 RDS）统一配置。
   - 格式：`mysql://USER:PASSWORD@HOST:PORT/DATABASE`；示例中 HOST=39.106.7.10、PORT=13306、DATABASE=devai，USER/PASSWORD 由运维在 env 中配置。
   - 备选：拆成 DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD 再在代码中拼接；本次不采用，以减小实现与文档范围。

3. **Schema 与 Client 位置**
   - `prisma/schema.prisma` 放在 `apps/backend` 下，generator 的 output 使用默认或 `node_modules/.prisma/client`，便于 backend 直接 import。
   - Client 单例：在 backend 内提供统一入口（如 `src/db.ts` 或 `src/common/prisma.ts`）导出 `PrismaClient` 实例，避免多实例连接。

4. **依赖与脚本**
   - 运行时依赖：`@prisma/client`。
   - 开发依赖：`prisma`；在 `package.json` 中增加 `postinstall` 或显式脚本 `prisma generate`，保证安装后即可生成 client。
   - 不在设计阶段引入迁移执行策略（如自动 migrate）；部署时由运维或 CI 显式执行 `prisma migrate`（若后续启用迁移）。

## Risks / Trade-offs

- **[Risk] 未配置 DATABASE_URL 时启动报错**  
  → mitigation：应用在首次使用 Prisma Client 时连接；可在入口或首次调用前做可选的健康检查（如 `prisma.$connect()`），失败时打日志并给出明确提示，不强制进程退出，以便无 DB 环境下仍能跑非 DB 相关功能（若需要可后续收紧）。

- **[Risk] 网络或权限导致连不上目标库**  
  → mitigation：依赖运维正确配置 USER/PASSWORD 与白名单；文档与 `.env.example` 中说明格式与目标 host/port/db，便于排查。

- **[Trade-off] 暂无业务表**  
  → 当前仅建立连接与 client 能力，业务表与迁移在后续迭代中按 spec 增加。

## Migration Plan

1. 在 `apps/backend` 添加依赖：`@prisma/client`、`prisma`（dev）。
2. 在 `apps/backend` 下新增 `prisma/schema.prisma`（datasource mysql，generator 指向默认或约定 output）；可含一占位 model 或留空。
3. 增加 `prisma generate` 脚本（或纳入 postinstall），确保安装后 client 可用。
4. 在 backend 中新增 DB 入口模块，导出单例 `PrismaClient`（从 env 读 `DATABASE_URL`）。
5. 在 `apps/backend/.env.example` 中增加 `DATABASE_URL` 示例（`mysql://USER:PASSWORD@39.106.7.10:13306/devai`）。
6. 部署时在目标环境配置 `DATABASE_URL`；若后续启用迁移，由 CI/运维在合适时机执行 `prisma migrate deploy`。
7. 回滚：移除或注释对 Prisma Client 的调用并回退依赖即可；无数据迁移时无额外回滚步骤。

## Open Questions

- 无。当前范围仅限接入 Prisma + MySQL 与 env 配置；业务表与迁移策略在后续 spec/tasks 中再定。
