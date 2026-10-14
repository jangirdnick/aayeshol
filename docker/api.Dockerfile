# ============================================
# API Dockerfile - NestJS + Prisma + pnpm
# Production Multi-Stage Build
# ============================================

# ---------- Base Stage ----------
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
WORKDIR /app

# ---------- Dependencies Stage ----------
FROM base AS deps

# Root and workspace definition files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
# Workspace package.json files
COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json

# Install dependencies needed for api and its workspace dependencies
RUN pnpm install --frozen-lockfile --filter=api...

# ---------- Builder Stage ----------
FROM base AS builder

# Copy resolved node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy workspace configs and source code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/types ./packages/types
COPY apps/api ./apps/api

ENV NODE_ENV=production

# 1. Build shared workspace types
RUN pnpm --filter=@aayeshol/types build

# 2. Generate Prisma Client
RUN pnpm --filter=api exec prisma generate

# 3. Build NestJS application
RUN pnpm --filter=api build

# 4. Prune dev dependencies for lean production deployment
RUN pnpm --filter=api --prod deploy /app/pruned-api

# ---------- Runner Stage ----------
FROM node:24-alpine AS runner
RUN apk add --no-cache dumb-init openssl && \
    addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nestjs

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy production pruned node_modules and package definition
COPY --from=builder --chown=nestjs:nodejs /app/pruned-api/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./package.json

# Copy compiled NestJS application
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist

# Copy Prisma schema and generated artifacts
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/src/generated ./src/generated

USER nestjs
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD node -e "const http = require('http'); const req = http.get('http://127.0.0.1:' + (process.env.PORT || 3001) + '/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)); req.on('error', () => process.exit(1));"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]