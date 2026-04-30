# Deployment Guide — PDF Annotator

## Architecture

```
Local Machine                GitHub Actions (7GB RAM)           VPS (1GB RAM)
─────────────               ───────────────────────           ───────────────
git push master  ──────►    pnpm install                      /var/www/pdf-annotator/
                            prisma generate                   ├── .env          (production secrets)
                            next build (standalone)           ├── current/      (active release)
                            package deploy artifact           ├── previous/     (rollback copy)
                            SCP upload to VPS     ──────►     └── incoming/     (temp landing zone)
                            SSH: migrate + restart
```

**Why:** `next build` needs 2-3GB RAM. The 1GB VPS can't handle it.
GitHub Actions builds the app, ships only the compiled output (~50-100MB).
The VPS only runs `server.js` (~150-250MB RAM).

---

## Directory Layout on VPS

| Path | Purpose |
|---|---|
| `/var/www/pdf-annotator/.env` | Production env vars (shared across releases) |
| `/var/www/pdf-annotator/current/` | Active release (deployed by CI) |
| `/var/www/pdf-annotator/previous/` | Previous release (automatic rollback) |
| `/var/www/pdf-annotator/incoming/` | Temp landing zone during deploy |
| `~/pdf-annotator/` | Git clone (used for worker + seed scripts) |

---

## How to Deploy

Just push to master:

```bash
git add .
git commit -m "your changes"
git push origin master
```

Monitor: `https://github.com/YOUR_USERNAME/pdf-annotator/actions`

---

## GitHub Secrets Required

Go to: Repo → Settings → Secrets and variables → Actions

| Secret | Value |
|---|---|
| `SERVER_HOST` | `40.233.127.60` |
| `SERVER_USER` | `ubuntu` |
| `SERVER_SSH_KEY` | Full contents of `key.key` (private SSH key) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog key (optional, leave empty if not using) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (optional, leave empty if not using) |

---

## VPS .env File

Location: `/var/www/pdf-annotator/.env`

Required vars:

```env
# Core
APP_ENV=production
APP_URL=http://40.233.127.60:3000
NEXTAUTH_URL=http://40.233.127.60:3000
NEXTAUTH_SECRET=<openssl rand -base64 48>
AUTH_SECRET=<same as NEXTAUTH_SECRET>
AUTH_TRUST_HOST=true
LOG_LEVEL=info

# Database (Neon)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Redis
REDIS_URL=redis://localhost:6379

# Storage
STORAGE_DRIVER=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Email
EMAIL_FROM="PDF Annotator <no-reply@40.233.127.60>"
RESEND_API_KEY=<your key or leave empty>

# Leave empty if not using
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_SENTRY_DSN=

# Admin
ADMIN_EMAILS=your@email.com
```

After editing: `pm2 restart pdf-annotator`

---

## PM2 Processes

| Process | What it runs | Working directory |
|---|---|---|
| `pdf-annotator` | Next.js standalone server | `/var/www/pdf-annotator/current` |
| `pdf-worker` | BullMQ background worker | `~/pdf-annotator` |

### Useful PM2 Commands

```bash
pm2 status                          # See all processes
pm2 logs pdf-annotator --lines 30   # View app logs
pm2 logs pdf-worker --lines 30      # View worker logs
pm2 restart pdf-annotator           # Restart app
pm2 restart pdf-worker              # Restart worker
pm2 delete pdf-annotator            # Remove app process
pm2 save                            # Save process list (survives reboot)
pm2 startup                         # Enable PM2 on boot
```

---

## Common Tasks

### Rollback to Previous Release

```bash
cd /var/www/pdf-annotator
rm -rf current
mv previous current
pm2 restart pdf-annotator
```

### Update .env Variables

```bash
nano /var/www/pdf-annotator/.env
pm2 restart pdf-annotator
```

### Seed the Database

```bash
# Option 1: Direct SQL (no dependencies needed)
psql "$DIRECT_URL" -c "
INSERT INTO \"Plan\" (id, name, price, limits, \"createdAt\", \"updatedAt\")
VALUES (
  'free', 'Free', 0,
  '{\"maxDocuments\":1000,\"maxStorageMB\":10000,\"maxAnnotationsPerDoc\":5000,\"maxShareLinks\":100,\"allowedFeatures\":[\"basic-annotation\",\"pdf-viewer\",\"image-annotation\",\"tags\",\"collections\",\"share-links-basic\"]}',
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
"

# Option 2: Via seed script (needs working node_modules)
cd ~/pdf-annotator
source /var/www/pdf-annotator/.env
export DATABASE_URL DIRECT_URL
pnpm db:seed
```

### Run Database Migrations Manually

```bash
cd /var/www/pdf-annotator/current
source /var/www/pdf-annotator/.env
export DIRECT_URL DATABASE_URL
npx prisma migrate deploy
```

### Start the Worker

```bash
cd ~/pdf-annotator
source /var/www/pdf-annotator/.env
export DATABASE_URL DIRECT_URL REDIS_URL CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET STORAGE_DRIVER
pm2 start "node --import tsx lib/jobs/worker.ts" \
  --name pdf-worker \
  --cwd /home/ubuntu/pdf-annotator
pm2 save
```

### Check Memory Usage

```bash
free -h          # System memory
pm2 monit        # PM2 process monitor (live)
```

---

## Troubleshooting

### Build fails in GitHub Actions

| Error | Fix |
|---|---|
| `Cannot resolve environment variable: DIRECT_URL` | Missing env var in workflow `env:` block |
| `ZodError: GOOGLE_CLIENT_ID expected string` | Missing dummy env var in workflow `env:` block |
| `NEXT_PUBLIC_*` vars not working in browser | These are baked at build time — set as GitHub Secrets |

### Deploy fails (SSH step)

| Error | Fix |
|---|---|
| `prisma migrate deploy` fails | Check `/var/www/pdf-annotator/.env` has correct `DIRECT_URL` |
| `Cannot find module 'dotenv/config'` | The deploy creates a minimal `prisma.config.ts` — this shouldn't happen |
| SSH timeout | `command_timeout: 5m` in workflow; check VPS isn't OOM |

### App won't start (PM2 errors)

| Error | Fix |
|---|---|
| `Could not find production build in ./.next` | PM2 running from wrong directory. Delete and re-create with `--cwd` |
| `SENTRY_DSN: Invalid URL` | Set `SENTRY_DSN=` (empty) in `.env` |
| `AUTH_SECRET: MISSING` | Add `AUTH_SECRET=<value>` to `.env` |
| `UntrustedHost` | Add `AUTH_TRUST_HOST=true` to `.env` |
| `Foreign key constraint: User_planId_fkey` | Run the seed SQL to create the Free plan |
| App crash loops (high restart count) | Check `pm2 logs pdf-annotator --err --lines 50` |

### General

```bash
# Check what's running
pm2 status

# Check disk space
df -h

# Check memory
free -h

# Check swap
swapon --show

# Add swap if missing (1GB)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Build-time vs Runtime Env Vars

| Type | When read | Where to set |
|---|---|---|
| `NEXT_PUBLIC_*` | Build time (baked into JS) | GitHub Secrets |
| Everything else | Runtime (read by server.js) | VPS `.env` file |
| Prisma vars (`DATABASE_URL`, `DIRECT_URL`) | Both | Workflow `env:` (dummy) + VPS `.env` (real) |

---

## CI/CD Workflow File

Location: `.github/workflows/deploy.yml`

Steps:
1. Checkout code
2. Setup pnpm + Node 20
3. `pnpm install --frozen-lockfile`
4. `prisma generate`
5. `next build` (standalone mode, `CI_BUILD=1`)
6. Package: `.next/standalone` + `.next/static` + `public` + `prisma/`
7. SCP upload to VPS
8. SSH: swap directories → migrate → PM2 restart

---

## One-Time VPS Setup Checklist

- [ ] Node.js 20+ installed
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Prisma installed globally (`npm install -g prisma`)
- [ ] Dotenv installed globally (`npm install -g dotenv`)
- [ ] Directory created: `/var/www/pdf-annotator/{current,incoming,previous}`
- [ ] `.env` file created at `/var/www/pdf-annotator/.env`
- [ ] PM2 startup configured (`pm2 startup` + run the output command)
- [ ] Swap space added (1GB)
- [ ] Database seeded (Free plan)
- [ ] SSH deploy key added to GitHub Secrets
