# ai-node

Full-stack monorepo: **Hono** (backend) + **React** (frontend), built with **Vite**, orchestrated by **Turborepo**, package manager **pnpm**.

## Tech stack

- **pnpm** – package manager, workspaces
- **Turborepo** – task orchestration (build, dev, lint) and caching
- **Backend** – Hono on Node, Vite build, port 3000
- **Frontend** – React SPA, Vite dev/build, port 5173

## Install

```bash
pnpm install
```

## Run

**All apps (dev):**

```bash
pnpm dev
```

Runs backend at `http://localhost:3000` and frontend at `http://localhost:5173`.

**Backend only:**

```bash
pnpm --filter backend dev
```

**Frontend only:**

```bash
pnpm --filter frontend dev
```

**Build all:**

```bash
pnpm build
```

## Env

- **Backend** – `apps/backend/.env.example`: `PORT=3000`
- **Frontend** – 无需 `VITE_API_ORIGIN`；API 请求使用相对路径 `/api/...`，见下方代理说明。

Copy to `.env` or `.env.local` and adjust as needed.

## API 代理

- **开发环境**：前端 Vite 已配置 `server.proxy`，将 `/api` 转发到后端（默认 `http://localhost:3000`），前端请求相对路径即可（如 `/api/ai/chat`、`/api/me`）。
- **生产环境**：部署时由 nginx（或等效反向代理）将 `/api` 反向代理到后端服务，保证前后端同源访问 API。

## Docker 构建与部署

构建上下文均为仓库根目录（`.`）。

**构建 backend 镜像：**

```bash
docker build -f apps/backend/Dockerfile -t ai-node-backend .
```

**构建 frontend 镜像：**

```bash
docker build -f apps/frontend/Dockerfile -t ai-node-frontend .
```

**一键启动（backend + frontend，MySQL 由外部提供）：**

需先设置 `DATABASE_URL` 指向外部 MySQL（格式如 `mysql://用户:密码@主机:3306/数据库名`），再执行：

```bash
docker compose up -d
```

- **前端**：<http://localhost:80>（nginx 将 `/api` 代理到 backend）
- **后端**：不映射到宿主机，仅对 frontend 容器开放，所有 API 通过前端同一端口访问

**环境变量（`docker compose` / 生产）：**

| 变量 | 说明 | 必填 |
|------|------|------|
| `DATABASE_URL` | MySQL 连接串（外部数据库），格式 `mysql://user:pass@host:3306/dbname` | 是 |
| `JWT_SECRET` | 后端 JWT 密钥 | 建议修改 |
| `JWT_EXPIRES_IN` | JWT 过期时间 | 否，默认 `7d` |
| `AI_KEY_ENCRYPTION_SECRET` | 后端 LLM API Key 加密密钥（至少 16 字符） | 建议修改 |

首次使用前需在外部 MySQL 上执行数据库迁移（如本地：`pnpm --filter backend exec prisma migrate deploy`，需能连到该 MySQL）。
