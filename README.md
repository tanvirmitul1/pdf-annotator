# PDF Annotator

Phase 1 scaffolds the product foundation: Next.js 15 App Router, Prisma + PostgreSQL, Auth.js v5-style auth, plans and entitlements, Redux Toolkit + RTK Query, rate limiting, typed errors, audit logging, Sentry, and PostHog.

## Local setup

1. Copy `.env.example` to `.env`.
2. Fill in the required Google OAuth and Auth.js secrets.
3. Start PostgreSQL and Redis:

```bash
docker compose up -d
```

4. Install dependencies:

```bash
pnpm install
```

5. Generate Prisma Client and run the initial migration:

```bash
pnpm db:generate
pnpm db:migrate --name init_scaffold
pnpm db:seed
```

6. Start the app:

```bash
pnpm dev
```

## Required commands

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Google Cloud Console OAuth setup

1. Open Google Cloud Console.
2. Create or select a project.
3. Open `APIs & Services` → `OAuth consent screen`.
4. Choose `External`, then fill in the app name, support email, and developer contact.
5. Add the scopes:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
6. Open `APIs & Services` → `Credentials`.
7. Create an `OAuth client ID`.
8. Choose `Web application`.
9. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - your production URL later
10. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - your production callback URL later
11. Copy the client ID into `GOOGLE_CLIENT_ID`.
12. Copy the client secret into `GOOGLE_CLIENT_SECRET`.

## Notes

- New users are provisioned onto the seeded `free` plan.
- Usage rows are initialized at zero for the tracked metrics.
- `/app/**` is protected by middleware and redirects to `/login` when logged out.
- Sentry and PostHog initialization are present, but they remain inert until the corresponding env vars are configured.
