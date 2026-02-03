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
