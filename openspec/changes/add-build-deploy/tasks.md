## 1. 构建上下文与排除

- [x] 1.1 在仓库根新增 `.dockerignore`，排除 `node_modules`、`.git`、无关 app 及构建产物目录，以缩短 Docker 构建上下文

## 2. Backend 镜像

- [x] 2.1 为 backend 新增 Dockerfile（多阶段：安装依赖 → 构建/运行），构建上下文为仓库根，最终阶段仅保留运行时与产物
- [x] 2.2 确认 backend 镜像可从根目录成功构建并可运行（启动命令与现有 backend 一致）

## 3. Frontend 镜像

- [x] 3.1 为 frontend 新增 Dockerfile（多阶段：安装依赖 → 构建静态产物 → nginx 提供静态资源），构建上下文为仓库根
- [x] 3.2 确认 frontend 镜像可从根目录成功构建并可提供前端静态资源访问

## 4. Docker Compose

- [x] 4.1 在仓库根新增 `docker-compose.yml`，定义 backend、frontend、mysql 三服务，配置网络与必要环境变量（MySQL 连接串、backend 端口、frontend 访问 backend API 的地址）
- [x] 4.2 为 mysql 服务配置 volume，实现数据持久化
- [x] 4.3 本地执行 `docker compose up` 验证：前端可打开、后端 API 可调通、MySQL 可连接

## 5. 文档

- [x] 5.1 在 README 或独立部署文档中补充：backend/frontend 镜像构建命令与构建上下文说明
- [x] 5.2 在文档中补充 docker compose 启动方式及 backend、frontend、MySQL 的端口与关键环境变量说明
