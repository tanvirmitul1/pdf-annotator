# Running PDF Annotator

## Prerequisites

- [Node.js 18+](https://nodejs.org)
- [pnpm](https://pnpm.io) — `npm i -g pnpm`
- [Docker](https://www.docker.com) (for PostgreSQL + Redis)

## 1. Environment

```bash
cp .env.example .env
```

Fill in these required values in `.env`:

| Variable | Where to get it |
|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials |
| `AUTH_SECRET` | Run `openssl rand -base64 32` |
| `DATABASE_URL` | Pre-filled for local Docker |
| `REDIS_URL` | Pre-filled for local Docker |

## 2. Start infrastructure

```bash
docker compose up -d
```

## 3. Install dependencies

```bash
pnpm install
```

## 4. Set up the database

```bash
pnpm db:generate
pnpm db:migrate --name init_scaffold
pnpm db:seed
```

## 5. Start the dev server

```bash
pnpm dev
```

App runs at **http://localhost:3000**

---

## Other commands

| Command | Purpose |
|---|---|
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint |
| `pnpm test` | Run tests |
| `pnpm build` | Production build |

## Google OAuth setup (quick)

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy the client ID and secret into `.env`
pnpm exec prisma studio
