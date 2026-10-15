# ============================================
# API Dockerfile - NestJS + Prisma + pnpm
# Production Multi-Stage Hardened Build
# ============================================

# ---------- Base Stage ----------
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat openssl
ENV CI=true
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
WORKDIR /app

# ---------- Dependencies Stage (Dev + Build) ----------
FROM base AS deps

# Root and workspace definition manifests for maximum layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json

# Install all dependencies needed to compile api and its workspace dependencies
RUN pnpm install --frozen-lockfile --filter=api...

# ---------- Builder Stage (Compile & Generate) ----------
FROM base AS builder

# Copy resolved node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy workspace configs and source code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/types ./packages/types
COPY apps/api ./apps/api

ENV NODE_ENV=production

# 1. Generate Prisma Client (outputs to apps/api/src/generated/prisma)
RUN pnpm --filter=api exec prisma generate

# 2. Build NestJS application (outputs to apps/api/dist)
RUN pnpm --filter=api build

# ---------- Production Dependencies Stage (Lean Runtime) ----------
FROM base AS prod-deps

# Copy manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json

# Install ONLY production dependencies (excludes devDependencies: nest cli, vitest, oxlint, typescript, etc.)
RUN pnpm install --prod --frozen-lockfile --filter=api... --ignore-scripts

# ---------- Runner Stage (Hardened Minimal Runtime) ----------
FROM node:24-alpine AS runner
RUN apk add --no-cache dumb-init openssl && \
    addgroup -S -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nestjs

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy production pruned node_modules from prod-deps stage
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules

# Copy workspace packages and manifests
COPY --from=builder --chown=nestjs:nodejs /app/packages/types ./packages/types
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json

# Copy compiled NestJS application and Prisma schema
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma

USER nestjs
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD node -e "const http = require('http'); const req = http.get('http://127.0.0.1:' + (process.env.PORT || 3001) + '/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)); req.on('error', () => process.exit(1));"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/main.js"]