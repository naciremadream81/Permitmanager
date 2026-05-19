# ──────────────────────────────────────────────
# Stage 1 — Install dependencies
# ──────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@9.5.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/ui-web/package.json ./packages/ui-web/package.json
COPY packages/permit-engine/package.json ./packages/permit-engine/package.json
COPY packages/ai/package.json ./packages/ai/package.json
COPY packages/config/package.json ./packages/config/package.json

RUN pnpm install --frozen-lockfile

# ──────────────────────────────────────────────
# Stage 2 — Build the application
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.5.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/ui-web/node_modules ./packages/ui-web/node_modules
COPY --from=deps /app/packages/permit-engine/node_modules ./packages/permit-engine/node_modules
COPY --from=deps /app/packages/ai/node_modules ./packages/ai/node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules

# Copy all source files
COPY . .

# Generate Prisma client if schema exists
RUN if [ -f "apps/web/prisma/schema.prisma" ]; then \
      cd apps/web && npx prisma generate; \
    fi

# Build the web application via turbo
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build --filter=@permitpro/web

# ──────────────────────────────────────────────
# Stage 3 — Production runner
# ──────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy the standalone build output
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
