# 打包与部署技术设计

## Context

- **现状**：monorepo（pnpm workspace），含 `apps/backend`（Hono + Vite）、`apps/frontend`（React），以及 `backend-mysql-prisma` 等已有能力；当前无统一构建/部署方案。
- **约束**：部署载体为 Docker；不改变现有应用端口与启动方式；构建与运行需在任意具备 Docker 的环境可复现。
- **干系人**：开发、后续 CI/CD 流水线。

## Goals / Non-Goals

**Goals:**

- 为 backend、frontend 提供可复现的构建流程与 Docker 镜像构建方式。
- 通过 docker compose 一键启动后端、前端及 MySQL，便于本地/单机部署与联调。
- 文档化镜像构建、compose 启动、环境变量与端口约定。

**Non-Goals:**

- 不做 K8s、多节点编排；不做 CI/CD 流水线实现（仅预留可接入的构建产物与镜像）。
- 不改变现有业务 API 与前端路由逻辑。

## Decisions

### 1. 镜像拆分：backend / frontend 各一个 Dockerfile

- **选择**：backend 与 frontend 各自独立 Dockerfile（可放在各 app 目录或根目录统一管理），分别构建镜像。
- **理由**：便于独立构建、缓存与发布；与 monorepo 的 app 边界一致。
- **备选**：单一 Dockerfile 多阶段产出两个镜像 — 增加复杂度且不利于单独迭代，不采用。

### 2. 后端镜像：多阶段构建（依赖安装 → 构建 → 运行）

- **选择**：多阶段 Dockerfile：先安装依赖并构建（如需要），最终阶段只保留运行时依赖与产物，使用 node 镜像运行。
- **理由**：减小最终镜像体积、避免把 devDependencies 和构建工具打进运行镜像。
- **备选**：单阶段直接 `pnpm install --prod` 后运行 — 若 backend 需先 build（如打包成单文件），则需在镜像内保留 pnpm/构建工具，采用多阶段更清晰。

### 3. 前端镜像：构建产物 + 静态服务

- **选择**：多阶段：先构建出静态产物（如 `dist`），最终阶段用 nginx 或 node 提供静态服务。
- **理由**：生产环境不依赖 Vite dev server；nginx 轻量且适合静态资源缓存。
- **备选**：最终阶段用 `node` + `serve` — 可行，nginx 更常见于生产静态托管。

### 4. Compose 拓扑：backend + frontend + mysql

- **选择**：一份 `docker-compose.yml` 定义三服务：backend、frontend、mysql；通过 compose 网络与环境变量连接（如 backend 连 MySQL、frontend 连 backend API）。
- **理由**：与 proposal 中“一键启动后端、前端及必要依赖”一致；MySQL 已有（backend-mysql-prisma），直接复用。
- **备选**：仅 backend + mysql，frontend 本地 dev — 本次设计覆盖“前端也容器化”的部署场景。

### 5. 构建上下文与 monorepo

- **选择**：Docker 构建上下文设为仓库根目录，便于 COPY 整个 workspace 或必要子目录；通过 `.dockerignore` 排除 node_modules、.git 等，缩短构建与层缓存。
- **理由**：pnpm workspace 依赖可能跨包，根上下文更稳妥；.dockerignore 为标配。
- **备选**：各 app 目录为上下文、按需 copy 上层 — 需处理 workspace 依赖，复杂度高，暂不采用。

### 6. 环境变量与端口

- **选择**：端口与关键环境变量在 compose 与 Dockerfile 中约定（如 backend 端口、frontend 代理到 backend 的 API base URL、MySQL 连接串）；文档中明确列出，与现有 backend-env-config 等约定一致。
- **理由**：避免与现有应用冲突；便于后续 CI 或生产覆盖同一套变量名。

## Risks / Trade-offs

| 风险 / 权衡 | 缓解 |
|------------|------|
| 根上下文构建导致镜像构建较慢 | 使用 .dockerignore；多阶段减少最终层；CI 可做层缓存 |
| 前端构建时依赖 backend API 地址 | 构建阶段用 build-arg 传入 API base URL 或占位符，运行时由 nginx/env 注入 |
| MySQL 数据持久化 | compose 中为 mysql 配置 volume，文档说明数据目录与备份建议 |
| 多环境（dev/staging/prod）配置差异 | 通过 env 文件或 compose override 区分，设计阶段仅约定变量名与默认端口 |

## Migration Plan

1. **落地顺序**：先增加 Dockerfile 与 .dockerignore，再增加 docker-compose.yml，最后更新 README/文档。
2. **验证**：本地 `docker compose up` 能完整启动并访问前端、后端与数据库；构建命令在干净环境可执行。
3. **回滚**：未改动现有源码逻辑，仅新增文件；若需回滚，移除新增的 Docker 相关文件即可。

## Open Questions

- 生产环境是否统一使用同一份 compose 文件，还是仅用于本地/单机，生产由其他编排接管？（建议：本次以“本地/单机 + 文档约定”为主，生产编排留给后续变更。）
