# Proposal: 后端 env 统一管理与架构优化

## Why

当前后端环境变量分散在多个模块中读取（`env.ts`、`prisma.ts`、`index.ts`、`prisma.config.ts`、`ai/provider.ts` 等），且多处重复调用 `dotenv`；缺少统一校验与类型约束，易在启动后才发现配置缺失或错误。统一 env 管理并在启动时完成校验，可提升可维护性与运行期可靠性。

## What Changes

- **统一加载与入口**：在单一模块中加载 dotenv、解析并导出配置，其它模块仅依赖该入口，不再直接读 `process.env` 或自行加载 dotenv。
- **配置校验**：启动时对必需变量（如 `DATABASE_URL`、`JWT_SECRET`、AI 相关键等）做存在性与格式校验，缺失或非法时立即失败并给出明确错误信息。
- **类型化访问**：对外暴露结构化、带类型的配置对象（或按领域拆分的子对象），替代零散的 `process.env.XXX`。
- **架构收敛**：移除各处的 `dotenv` 调用与调试用 `console.log(process.env...)`，Prisma、JWT、AI、HTTP 等子模块仅通过统一 config 获取所需项。
- 不改变现有 API 或对外行为，仅调整内部配置的获取方式。

## Capabilities

### New Capabilities

- `backend-env-config`: 后端环境变量与配置的统一加载、校验与类型化访问；规定加载顺序、必需/可选变量、启动时校验规则及对外导出形式。

### Modified Capabilities

- （无。本次不修改现有 spec 的对外需求，仅规范实现层面的配置管理。）

## Impact

- **受影响代码**：`apps/backend/src/common/env.ts`（重写或替换为统一 config 模块）、`apps/backend/src/index.ts`、`apps/backend/src/common/prisma.ts`、`apps/backend/src/auth/jwt.ts`、`apps/backend/src/ai/provider.ts`、`apps/backend/src/ai/model.ts`、`apps/backend/src/ai/middleware.ts`、`apps/backend/src/ai/proxy-fetch.ts`、`apps/backend/prisma.config.ts`、`apps/backend/vite.config.ts`（若需读取 PORT 等，改为从统一 config 或保留最小 env 读取）。
- **依赖**：继续使用 `dotenv`；可选引入轻量校验库（如 zod）用于 schema 校验。
- **部署与文档**：`.env.example` 与部署文档需与新的必需/可选变量列表保持一致；行为上仍通过环境变量注入，不改变现有部署方式。
