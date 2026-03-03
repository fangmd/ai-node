# Build stage: install deps and build frontend (context: repo root)
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy only package.json for each workspace package (better layer cache)
COPY packages/types/package.json ./packages/types/
COPY packages/json-render/package.json ./packages/json-render/
COPY packages/prettier-config/package.json ./packages/prettier-config/
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/frontend ./apps/frontend
COPY tsconfig.base.json ./

RUN pnpm --filter frontend run build

# Run stage: nginx serves static + proxy /api to backend
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
