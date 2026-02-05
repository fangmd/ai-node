# 打包与部署需求

## Why

当前项目以后端（Hono）+ 前端（React）的 monorepo 形式开发，缺少统一的构建与部署方案，无法在任意环境一致地运行与交付。引入基于 Docker 的打包与部署能力，可做到构建产物可复现、部署方式统一，便于开发/测试/生产环境一致性与后续 CI/CD 集成。

## What Changes

- 为前端、后端定义可复用的构建流程（含产物输出与依赖安装）。
- 使用 **Docker** 作为部署载体：为 backend、frontend（或前后端一体）提供 Dockerfile 与镜像构建方式。
- 提供基于 Docker 的本地/单机运行方式（如 `docker compose`），能一键启动后端、前端及必要依赖（如 MySQL）。
- 文档化构建与部署步骤（如何构建镜像、如何用 compose 启动、环境变量与端口约定）。

## Capabilities

### New Capabilities

- `docker-build-deploy`: 覆盖 monorepo 下前端与后端的构建、Docker 镜像构建、以及基于 Docker（含 compose）的部署与运行方式；包含 Dockerfile、compose 配置及构建/部署文档约定。

### Modified Capabilities

- （无：仅新增能力，不修改现有 spec 的行为需求。）

## Impact

- **代码/配置**：新增 `Dockerfile`（及可选多阶段构建）、`docker-compose*.yml`、`.dockerignore`；可能增加根目录或各 app 下的构建脚本。
- **依赖**：仅要求本地/CI 安装 Docker（及可选 Docker Compose），不强制改动现有 Node/pnpm 依赖。
- **仓库与文档**：README 或独立文档需补充构建与部署说明（镜像构建命令、compose 启动方式、环境变量与端口）。
- **现有应用**：backend、frontend 的启动与端口约定保持不变；通过环境变量与 compose 配置对接即可，无需改动现有业务代码逻辑。
