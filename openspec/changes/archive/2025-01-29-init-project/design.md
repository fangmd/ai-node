# 初始化项目 - Design

## Context

- **现状**：仓库仅有 README、openspec 配置，无应用代码；需从零搭建全栈能力。
- **约束**：包管理器固定为 pnpm；后端 Hono.js、前端 React SPA；前后端均用 Vite 构建；任务编排使用 Turborepo；采用 monorepo 便于共享配置与脚本。
- **受众**：后续实现 tasks 与维护者需据此做目录、工具与运行方式的一致约定。

## Goals / Non-Goals

**Goals:**

- 确定 monorepo 目录与 workspace 约定，以及根级脚本/配置策略。
- 确定后端（Hono）的入口、运行方式、与前端联调时的端口/CORS 等。
- 确定前端（React SPA）的构建工具、入口、开发/生产命令及与后端的对接方式。
- 为后续 specs/tasks 提供明确的「怎么做」依据，避免实现阶段反复定方案。

**Non-Goals:**

- 不在此设计具体业务 API 或前端页面；仅搭架子。
- 不引入数据库、认证、部署流水线等；仅本地/开发环境可运行即可。
- 不规定状态管理、路由库选型细节；由 frontend-app spec 可再细化。

## Decisions

### 1. Monorepo 目录与 workspace

- **选择**：`apps/backend`、`apps/frontend` 为两个应用包；根目录 `package.json` 仅负责 workspace 与根脚本；可选 `packages/` 预留共享包（如 `packages/tsconfig`）。
- **理由**：与 proposal 一致，结构清晰；`apps/` 约定常见于 pnpm/turborepo 等，便于后续加 CI/缓存。
- **备选**：`backend/`、`frontend/` 置于根下——采用 `apps/` 更利于与未来多 app 扩展一致。

### 2. 包管理与任务编排

- **选择**：pnpm workspace（`pnpm-workspace.yaml` 声明 `apps/*`、可选 `packages/*`）；**任务编排使用 Turborepo**：根目录 `turbo.json` 定义 pipeline（`build`、`dev`、`lint` 等），根脚本通过 `turbo run build`、`turbo run dev` 等编排各 app；各 app 自带 `dev`、`build` 等脚本，由 turbo 并发/按依赖执行。
- **理由**：与项目约定一致；Turborepo 提供缓存与依赖顺序，根目录一键 `pnpm build` 可先建后端再建前端，`pnpm dev` 可并行起前后端，便于文档与 CI。
- **备选**：仅用 pnpm -F——不采纳；初期即引入 turbo 统一脚本与缓存。

### 3. 后端：构建与运行时

- **选择**：**后端打包也使用 Vite**；入口为单文件（如 `src/index.ts`）；开发时用 `vite` 的 dev 或 `vite-node` 运行；生产用 Vite 构建（Node 目标 / library 模式）产出单 bundle，再以 `node` 运行。
- **理由**：与前端统一构建工具，配置与脚本一致；Vite 对 Node/SSR 目标支持良好，可产出单文件便于部署。
- **备选**：tsx/tsc+node——不采纳；统一用 Vite 便于 monorepo 内脚本与 turbo pipeline 一致。

### 4. 后端：端口与 CORS

- **选择**：后端固定端口（如 3000）；开发时开启 CORS 允许前端 dev 源（如 localhost:5173）；CORS 逻辑用 Hono 中间件或内置选项实现。
- **理由**：前后端分离开发时同源策略必须处理；先简单允许 dev 源即可，生产由部署再定。

### 5. 前端：构建与 dev 服务器

- **选择**：使用 **Vite** 作为 React SPA 的构建与 dev 服务器；端口与后端区分（如 5173）；API 请求通过环境变量配置 base URL，开发时指向后端端口。
- **理由**：前后端统一用 Vite，配置与 Turborepo pipeline 一致；Vite 与 React 生态成熟、启动快；先采用直连 + 环境变量，实现简单。
- **备选**：CRA / Next 等——不采纳；proposal 明确为 SPA，Vite 更轻量。

### 6. 共享配置

- **选择**：根目录或 `packages/` 下共享 `tsconfig` 基座（如 `extends`）；ESLint 可在根配置并覆盖 apps，或各 app 各自配置；优先根级一致，避免重复。
- **理由**：TS/ESLint 一致性能减少差异与冲突；共享配置为 monorepo 的常见做法。

## Risks / Trade-offs

| 风险 / 权衡                            | 缓解                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| 后端端口与前端代理未统一约定，文档不清 | 在 README 与各 app 的 `.env.example` 中明确端口与 `VITE_API_ORIGIN` 等变量。 |
| 后端用 Vite 构建需正确配置 Node 目标   | 使用 Vite 的 Node/SSR 相关配置或插件，确保产出为 Node 可执行 bundle。        |
| 仅 Node 运行后端，高并发场景未优化     | 本阶段仅搭架子；后续若有性能需求再考虑多进程/边缘等。                        |

## Migration Plan

- **适用场景**：绿地从零搭建，无旧代码迁移。
- **步骤**：按 tasks 顺序执行——先 monorepo-setup（workspace、pnpm、**Turborepo**、根脚本），再 backend-api（Hono + **Vite 构建**、入口、CORS、脚本），再 frontend-app（Vite+React、环境变量、脚本）；最后更新 README 与 openspec 文档。
- **回滚**：无生产流量；若需撤销，回退对应 commit 或删除新增目录即可。

## Open Questions

- 是否在本次初始化中增加 `packages/tsconfig`（或类似）共享包，还是仅在根放一份 `tsconfig.base.json` 供各 app 引用？建议：根目录单份 base 即可，减少包数量。
- 前端是否需要在 Vite 中配置 dev 时代理到后端（避免 CORS）？建议：先 CORS + 直连，若遇问题再加 proxy。
