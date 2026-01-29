# 初始化项目 - Proposal

## Why

需要从零搭建一个全栈项目，后端用 Hono.js 提供 API，前端用 React 做 SPA，并通过 monorepo 统一管理前后端与共享代码，便于后续迭代和复用。

## What Changes

- 采用 **monorepo** 仓库架构（如 pnpm workspace）。
- **后端**：基于 Hono.js 的 Node 服务，提供 REST API，可扩展中间件与路由。
- **前端**：React SPA，可独立开发、构建与部署。
- 根目录配置：TypeScript、ESLint、通用脚本；各 package 可独立 `build`/`dev`。
- README 与基础文档更新为当前技术栈说明。

## Capabilities

### New Capabilities

- `monorepo-setup`: 仓库根目录的 workspace 配置、包管理（pnpm）、共享 TS/ESLint 配置、根脚本与文档。
- `backend-api`: 基于 Hono.js 的后端应用，入口、路由、开发/生产运行方式，以及与 monorepo 的集成。
- `frontend-app`: React SPA 应用，入口、基础路由与构建配置，以及与 monorepo 的集成。

### Modified Capabilities

- （无：当前无已有 spec 需变更。）

## Impact

- **代码/结构**：新增 `apps/backend`、`apps/frontend`（或等价目录），以及根 `package.json`、`pnpm-workspace.yaml` 等。
- **依赖**：引入 Hono、React 及相关构建与类型依赖；包管理器固定为 pnpm。
- **开发体验**：支持在根目录一键安装依赖、按 package 运行 dev/build，便于全栈联调。
