# ── Base ──────────────────────────────────────────────────
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ── Dependencies ───────────────────────────────────────���──
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DOCKER_BUILD=1
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm db:generate
RUN pnpm build

# ── Production deps only ──────────────────────────────────
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile --prod

# ── App runner ────────────────────────────────────────────
FROM base AS app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=prod-deps /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "server.js"]

# ── Worker runner ─────────────────────────────────────────
FROM base AS worker
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY . .
RUN pnpm db:generate

CMD ["node", "--import", "tsx", "lib/jobs/worker.ts"]
