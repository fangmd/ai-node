# Build stage: install deps, generate Prisma client, build backend (context: repo root)
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY packages/types ./packages/types
COPY apps/backend ./apps/backend
COPY tsconfig.base.json ./

# Prisma generate (schema present only after COPY) and build
RUN pnpm --filter backend exec prisma generate
RUN pnpm --filter backend run build

# Run stage: production deps + dist + generated client only
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY packages/types ./packages/types
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/src/generated ./apps/backend/src/generated
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/skills ./skills

WORKDIR /app/apps/backend
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
