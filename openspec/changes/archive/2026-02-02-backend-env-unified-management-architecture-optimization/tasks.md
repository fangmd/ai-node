## 1. Setup

- [x] 1.1 Add zod to backend dependencies
- [x] 1.2 Create config module: single dotenv load (`.env.example` then `.env`) in `src/common` (e.g. keep `env.ts` or rename to `config.ts`)

## 2. Config schema and export

- [x] 2.1 Define zod schema for required variables (DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, server port, AI provider/model/keys as applicable)
- [x] 2.2 Add optional/grouped fields (proxy, ai provider-specific keys) and parse on load; on parse failure exit with clear error (variable name + reason, no secret values)
- [x] 2.3 Export typed config object grouped by domain (server, auth, database, ai, proxy); derive TypeScript type from schema with `z.infer`

## 3. Migrate application code to config

- [x] 3.1 In `src/index.ts`: import config first, remove dotenv and process.env reads, remove debug console.log(process.env.*), use config for port and isDev
- [x] 3.2 In `src/common/prisma.ts`: remove dotenv, get DATABASE_URL from config
- [x] 3.3 In `src/auth/jwt.ts`: use config.auth (JWT_SECRET, JWT_EXPIRES_IN) instead of env module
- [x] 3.4 In `src/ai/provider.ts`: get AI_PROVIDER, baseURL, apiKey from config.ai; remove direct process.env reads
- [x] 3.5 In `src/ai/model.ts`: get model and isDev from config
- [x] 3.6 In `src/ai/middleware.ts`: get isDev from config
- [x] 3.7 In `src/ai/proxy-fetch.ts`: get HTTP_PROXY/HTTPS_PROXY from config.proxy (if present)

## 4. Prisma and Vite config

- [x] 4.1 In `prisma.config.ts`: either import config and use config.database.url, or keep minimal dotenv load for DATABASE_URL only and add a short comment that this is the exception for Prisma tooling load order
- [x] 4.2 In `vite.config.ts`: if port is needed, use minimal env read or document exception; prefer not adding config import if Vite runs before app entry

## 5. Cleanup and docs

- [x] 5.1 Remove any remaining debug console.log(process.env.*) in backend
- [ ] 5.2 Update `.env.example` comments to list required vs optional variables and align with schema
- [x] 5.3 Run backend dev and build, confirm server starts and auth/AI/DB work without regression
