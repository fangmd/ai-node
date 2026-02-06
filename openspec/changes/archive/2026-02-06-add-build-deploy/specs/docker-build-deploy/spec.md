# docker-build-deploy

## Purpose

Monorepo 下前端与后端的构建、Docker 镜像构建、以及基于 Docker（含 compose）的部署与运行；包含 Dockerfile、compose 配置及构建/部署文档约定。

## ADDED Requirements

### Requirement: Backend Docker 镜像可构建

系统 SHALL 提供 backend 的 Dockerfile，支持从仓库根或约定上下文构建出可运行的后端镜像。镜像 SHALL 使用多阶段构建，最终阶段仅包含运行时依赖与产物。构建 MUST 使用 pnpm 与现有 workspace 依赖一致。

#### Scenario: 从根上下文构建 backend 镜像

- **WHEN** 用户在仓库根执行约定的 backend 镜像构建命令（如 `docker build -f apps/backend/Dockerfile .` 或等同）
- **THEN** 成功产出可运行的 backend 镜像，且该镜像内可执行 backend 应用的启动命令

#### Scenario: backend 镜像不包含 dev 依赖

- **WHEN** 构建得到的 backend 镜像被运行
- **THEN** 镜像内不包含 devDependencies 或构建工具（多阶段最终阶段仅运行时）

### Requirement: Frontend Docker 镜像可构建

系统 SHALL 提供 frontend 的 Dockerfile，支持从仓库根或约定上下文先构建出静态产物，再在最终阶段用静态服务（如 nginx）提供该产物。构建 MUST 使用 pnpm 与现有 workspace 一致。

#### Scenario: 从根上下文构建 frontend 镜像

- **WHEN** 用户在仓库根执行约定的 frontend 镜像构建命令
- **THEN** 成功产出包含前端静态产物的镜像，且该镜像内可提供静态资源访问（如 nginx 监听端口）

#### Scenario: frontend 镜像提供静态资源

- **WHEN** 构建得到的 frontend 镜像被运行并访问根路径
- **THEN** 返回前端应用的静态资源（如 index.html 或 SPA 入口）

### Requirement: Docker 构建排除无关文件

仓库根或构建上下文 MUST 包含 `.dockerignore`，排除 `node_modules`、`.git`、无关 app 的源码等，以缩短构建时间与镜像层。

#### Scenario: 构建时排除 node_modules

- **WHEN** 执行 backend 或 frontend 的 `docker build`
- **THEN** 上下文不包含各包下的 `node_modules`（由 .dockerignore 排除）

### Requirement: Compose 一键启动 backend、frontend、MySQL

系统 SHALL 提供 `docker-compose.yml`（或等同文件名），定义 backend、frontend、mysql 三个服务，通过 compose 网络与环境变量使 backend 可连 MySQL、frontend 可访问 backend API。运行 `docker compose up` 后 SHALL 能访问前端页面与后端接口。

#### Scenario: compose up 后三服务就绪

- **WHEN** 在仓库根执行 `docker compose up`（或约定命令）并等待就绪
- **THEN** backend、frontend、mysql 服务均运行，且 frontend 可打开、backend API 可调通

#### Scenario: MySQL 数据可持久化

- **WHEN** compose 中 mysql 服务配置了 volume
- **THEN** 重启 compose 后 MySQL 数据仍存在（未显式删除 volume 时）

### Requirement: 构建与部署文档化

README 或独立部署文档 SHALL 说明：如何构建 backend/frontend 镜像（含命令与构建上下文）、如何用 docker compose 启动、环境变量与端口约定（与 backend-env-config 等现有约定一致）。

#### Scenario: 文档包含镜像构建命令

- **WHEN** 开发者阅读 README 或部署文档
- **THEN** 能看到 backend 与 frontend 的 Docker 镜像构建命令及构建上下文说明

#### Scenario: 文档包含 compose 与端口

- **WHEN** 开发者阅读部署文档
- **THEN** 能看到 docker compose 启动方式及 backend、frontend、MySQL 的端口与关键环境变量说明
