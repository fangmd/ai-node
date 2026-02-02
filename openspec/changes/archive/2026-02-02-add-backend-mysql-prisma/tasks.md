## 1. Setup

- [x] 1.1 Add `@prisma/client` and `prisma` (dev) to `apps/backend/package.json`
- [x] 1.2 Add `prisma generate` script (or postinstall) to `apps/backend/package.json` so client is generated after install

## 2. Schema and Client

- [x] 2.1 Create `apps/backend/prisma/schema.prisma` with MySQL datasource and `url = env("DATABASE_URL")`
- [x] 2.2 Add minimal or placeholder model in schema so Prisma Client can be generated
- [x] 2.3 Create Prisma Client singleton module (e.g. `src/db.ts` or `src/common/prisma.ts`) exporting a single shared `PrismaClient` instance

## 3. Configuration

- [x] 3.1 Add `DATABASE_URL` example to `apps/backend/.env.example` (format: `mysql://USER:PASSWORD@39.106.7.10:13306/devai`)
