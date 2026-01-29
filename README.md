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
- **Frontend** – `apps/frontend/.env.example`: `VITE_API_ORIGIN=http://localhost:3000`

Copy to `.env` or `.env.local` and adjust as needed.
