## 1. Monorepo setup

- [x] 1.1 Add root package.json with scripts (build, dev, lint) and pnpm-workspace.yaml (apps/*)
- [x] 1.2 Add tsconfig.base.json at root for apps to extend
- [x] 1.3 Add turbo.json with pipeline for build, dev, lint
- [x] 1.4 Add .gitignore for node_modules, dist, .turbo, .env.local

## 2. Backend (apps/backend)

- [x] 2.1 Create apps/backend with package.json (name, scripts: dev, build, start)
- [x] 2.2 Add Hono app in src/index.ts with CORS and health/root route, listen on port from env (default 3000)
- [x] 2.3 Add Vite config for Node build (entry src/index.ts, output for Node)
- [x] 2.4 Add tsconfig.json extending root base; add .env.example with PORT
- [x] 2.5 Install backend deps: hono, vite, vite-node (or tsx), types

## 3. Frontend (apps/frontend)

- [x] 3.1 Create apps/frontend with Vite React template (package.json, index.html, src/main.tsx, src/App.tsx)
- [x] 3.2 Add .env.example with VITE_API_ORIGIN; use env in app for API base URL
- [x] 3.3 Add tsconfig.json extending root base
- [x] 3.4 Ensure dev (port 5173) and build scripts work and package is in workspace

## 4. Documentation

- [x] 4.1 Update README with tech stack (pnpm, Turborepo, Hono, React, Vite), install, and run instructions (ports, env)
