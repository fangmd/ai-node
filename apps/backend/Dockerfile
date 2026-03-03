# Build stage: install deps, generate Prisma client, build backend (context: repo root)
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy only package.json for each workspace package (better layer cache)
COPY packages/types/package.json ./packages/types/
COPY packages/json-render/package.json ./packages/json-render/
COPY packages/prettier-config/package.json ./packages/prettier-config/
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY packages/ ./packages/
COPY apps/backend ./apps/backend
COPY tsconfig.base.json ./

# Prisma generate (schema present only after COPY) and build
RUN pnpm --filter backend exec prisma generate
RUN pnpm --filter backend run build

# Run stage: production deps + dist + generated client only
FROM node:22 AS runner
# Chromium 依赖：容器内无 sudo，用 root 直接 apt 安装（--with-deps 会调 sudo 导致失败）
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
    libpango-1.0-0 libcairo2 libatspi2.0-0 libxshmfence1 \
    fonts-liberation libappindicator3-1 xdg-utils \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app

RUN pnpm install -g agent-browser
RUN agent-browser install

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/json-render/package.json ./packages/json-render/
COPY packages/prettier-config/package.json ./packages/prettier-config/
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY packages/ ./packages/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/src/generated ./apps/backend/src/generated
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
COPY --from=builder /app/apps/backend/skills ./skills

WORKDIR /app/apps/backend
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
