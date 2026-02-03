# Design: 后端 env 统一管理与架构优化

## Context

后端当前在 `env.ts`、`prisma.ts`、`index.ts`、`prisma.config.ts`、`ai/provider.ts` 等多处加载 dotenv 或直接读取 `process.env`；配置无统一校验，JWT_SECRET 可为空、DATABASE_URL 仅在 Prisma 连接时才报错。本次在保持对外 API 与部署方式不变的前提下，将配置收敛到单一入口并做启动时校验。

## Goals / Non-Goals

**Goals:**

- 单一入口加载 dotenv 并导出类型化配置，其它模块仅依赖该入口。
- 启动时对必需变量做存在性与基本格式校验，失败时立即退出并给出明确错误。
- 对外暴露结构化、按领域可选的配置对象（server、auth、database、ai、proxy 等），便于类型安全与测试。
- 移除各处重复的 dotenv 调用与调试用 `console.log(process.env...)`。

**Non-Goals:**

- 不改变现有 HTTP/API 行为、认证逻辑或数据库/AI 调用方式。
- 不引入复杂配置层（如远程 config 服务、多环境文件策略）；仍以 `.env` + 环境变量为主。
- `vite.config.ts` 与 `prisma.config.ts` 若必须在模块顶层读 env，可保留最小读取或通过 Vite/Prisma 约定处理，不强制经统一模块。

## Decisions

1. **配置模块形态**
   - 采用单文件 `src/common/env.ts`（或重命名为 `config.ts`）作为唯一加载与导出点；在应用入口 `index.ts` 最顶部 import 该模块，确保任何业务代码执行前已完成加载与校验。
   - 备选：拆成 `config/load.ts` + `config/schema.ts`；当前体量下单文件更简单，后续变量增多再拆不迟。

2. **校验方式**
   - 使用 **zod** 做 schema 校验：一次定义类型与校验规则，启动时 `parse`，失败则 `throw` 并打印缺失/非法变量名与原因。
   - 备选：手写校验函数；zod 与 TypeScript 类型推导一致，减少重复且错误信息可读性好。

3. **配置结构**
   - 按领域分组导出（如 `config.server`、`config.auth`、`config.database`、`config.ai`、`config.proxy`），各子模块只引用自己需要的部分，避免大对象横传。
   - 备选：扁平单对象；分组更利于按模块收敛依赖与后续扩展。

4. **加载顺序与文件**
   - 保持与现有一致：先 `.env.example`（文档/默认），再 `.env`（本地覆盖）；不改变现有部署方式，生产仍通过环境变量注入。

5. **Prisma / Vite 与统一模块**
   - Prisma 与 Vite 在各自配置文件中有自己的 env 读取需求；若其必须在顶层执行且不能依赖应用代码，则：Prisma 在 `prisma.config.ts` 中可继续单独加载 dotenv 并读 `DATABASE_URL`，或改为从统一模块的同步 getter 获取（需保证该模块在 Prisma 配置执行前已加载）。设计上优先让 `index.ts` 最先 import 统一 config，其它应用内代码一律用 config；Prisma/Vite 若存在加载顺序限制，可保留最小 dotenv 读取仅限 `DATABASE_URL`/`PORT`，并在 design 中注明例外。

## Risks / Trade-offs

- **启动顺序**：若 Prisma/Vite 在应用主入口之前执行，则无法依赖统一 config。→ 明确约定：应用运行时所有业务与 DB 访问均经统一 config；构建/迁移时若工具链要求，仅对个别变量做最小读取并文档化。
- **敏感信息**：配置对象会携带 JWT_SECRET、API Key 等。→ 仅内存持有，不落盘、不日志；错误信息中只提示变量名与校验失败原因，不打印值。
- **类型与运行时一致**：zod 与 TS 类型需同步。→ 使用 `z.infer<typeof schema>` 导出类型，单一 schema 定义保证一致。

## Migration Plan

1. 在 `env.ts`（或新 `config.ts`）中实现 zod schema 与单次加载/校验，导出分组后的 config。
2. 将 `index.ts`、`prisma.ts`、`auth/jwt.ts`、`ai/*` 等改为从 config 读取，移除各自 dotenv 与 `process.env` 直读；删除调试用 console.log。
3. 调整 `prisma.config.ts`（若可行则改为从 config 取 DATABASE_URL；否则保留最小 dotenv 并注明）。
4. 运行现有测试与本地启动，确认无回归；更新 `.env.example` 注释与部署文档以反映必需/可选变量。
5. 无功能开关与回滚逻辑；变更为内部重构，出问题可代码回滚。

## Open Questions

- 无。Prisma/Vite 若遇加载顺序问题，按上述“最小读取例外”处理即可。
