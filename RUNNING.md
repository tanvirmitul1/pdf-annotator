# Running PDF Annotator

## Local Development

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- [pnpm](https://pnpm.io) — `npm i -g pnpm`
- [Docker](https://www.docker.com) (for PostgreSQL + Redis)

### 1. Environment

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

### 2. Start infrastructure (PostgreSQL + Redis)

```bash
docker compose up -d
```

Verify they're running:

```bash
docker compose ps
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Set up the database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed the free plan
pnpm db:seed
```

### 5. Start the dev server + worker

```bash
# Recommended — runs Next.js + worker together
pnpm dev:all
```

App runs at **http://localhost:3000**

You can also run them separately in two terminals:

```bash
# Terminal 1
pnpm dev

# Terminal 2
pnpm worker
```

### Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy the client ID and secret into `.env`

---

## All Commands Reference

### Development

| Command | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server only |
| `pnpm dev:all` | Next.js + background worker together |
| `pnpm worker` | Background worker only (PDF processing, thumbnails) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server (after build) |

### Code Quality

| Command | Purpose |
|---|---|
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier format all files |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Run tests in watch mode |

### Database

| Command | Purpose |
|---|---|
| `pnpm db:generate` | Regenerate Prisma client after schema changes |
| `pnpm db:migrate` | Create + apply a new migration (dev) |
| `pnpm db:deploy` | Apply pending migrations (production) |
| `pnpm db:seed` | Seed the free plan |
| `pnpm exec prisma studio` | Open database GUI in browser |
| `pnpm exec prisma db pull` | Pull schema from existing database |

### Scripts

| Command | Purpose |
|---|---|
| `pnpm tsx scripts/requeue-failed.ts` | Re-queue all failed document processing jobs |

### Database Utilities

| Command | Purpose |
|---|---|
| `pnpm exec prisma studio` | Open database GUI at http://localhost:5555 |
| `pnpm exec prisma db pull` | Introspect existing DB into schema |
| `pnpm exec prisma migrate reset` | Drop DB, re-run all migrations + seed (fresh start) |
| `pnpm exec prisma migrate status` | Check which migrations have been applied |
| `docker compose exec postgres psql -U postgres pdf_annotator` | Open raw PostgreSQL shell |
| `docker compose exec redis redis-cli` | Open Redis CLI |

Common SQL queries in the PostgreSQL shell:

```sql
-- List all users
SELECT id, name, email, "planId" FROM "User";

-- Check document processing status
SELECT id, name, status, "processingProgress", "createdAt" FROM "Document" ORDER BY "createdAt" DESC LIMIT 10;

-- Count documents per status
SELECT status, COUNT(*) FROM "Document" GROUP BY status;

-- Check usage for a user
SELECT * FROM "Usage" WHERE "userId" = 'some-user-id';

-- Find failed documents
SELECT id, name, status, "updatedAt" FROM "Document" WHERE status = 'FAILED';
```

Common Redis commands:

```bash
# Check queue length
docker compose exec redis redis-cli LLEN bull:main:wait

# List all keys
docker compose exec redis redis-cli KEYS "bull:*"

# Flush all queues and cache (careful!)
docker compose exec redis redis-cli FLUSHALL
```

### Git Workflow

| Command | Purpose |
|---|---|
| `git status` | Check working tree |
| `git log --oneline -10` | Recent commits |
| `git diff` | Unstaged changes |
| `git stash` | Temporarily shelve changes |
| `git stash pop` | Restore shelved changes |

### Debugging

| Command | Purpose |
|---|---|
| `pnpm dev:all` | See Next.js + worker logs together (color-coded) |
| `pnpm worker` | Run worker alone to see detailed processing logs |
| `pnpm tsx scripts/requeue-failed.ts` | Re-queue all failed document jobs |
| `pnpm exec prisma studio` | Visually inspect/edit DB records |

### Local Docker (infrastructure)

| Command | Purpose |
|---|---|
| `docker compose up -d` | Start PostgreSQL + Redis |
| `docker compose down` | Stop PostgreSQL + Redis |
| `docker compose ps` | Check running services |
| `docker compose logs -f postgres` | View PostgreSQL logs |
| `docker compose logs -f redis` | View Redis logs |
| `docker compose restart postgres` | Restart PostgreSQL |
| `docker compose restart redis` | Restart Redis |

### Full Reset (start fresh locally)

```bash
# Reset database (drops everything, re-runs migrations + seed)
pnpm exec prisma migrate reset

# Or nuclear option — rebuild Docker volumes too
docker compose down -v
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

---

## Production Deployment (Oracle VPS with Nginx)

Deploy to Oracle Cloud VPS (or any Ubuntu VPS) with Nginx reverse proxy. All services (PostgreSQL, Redis, Next.js app, background worker) run in Docker containers. Access the app by visiting your server IP or domain.

### 1. Server setup

SSH into your VPS and install Docker:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect

# Install Docker Compose plugin (if not included)
sudo apt-get install docker-compose-plugin

# Verify
docker --version
docker compose version
```

### 2. Clone and configure

```bash
git clone https://github.com/tanvirmitul1/pdf-annotator.git
cd pdf-annotator

cp .env.example .env
nano .env
```

Edit `.env` with production values:

```bash
# REQUIRED — generate a strong password
POSTGRES_PASSWORD="your-strong-db-password-here"

# REQUIRED — generate with: openssl rand -base64 32
AUTH_SECRET="your-auth-secret-here"

# REQUIRED — your domain or VPS IP
APP_URL="https://yourdomain.com"
NEXTAUTH_URL="https://yourdomain.com"

# Google OAuth (update redirect URI to your domain)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# These are overridden by docker-compose internally,
# but keep them for reference:
DATABASE_URL="postgresql://postgres:your-strong-db-password-here@postgres:5432/pdf_annotator?schema=public"
DIRECT_URL="postgresql://postgres:your-strong-db-password-here@postgres:5432/pdf_annotator?schema=public"
REDIS_URL="redis://redis:6379"

# Optional — set a Redis password
REDIS_PASSWORD="your-redis-password"

# Storage — local volume inside Docker
STORAGE_DRIVER="local"
STORAGE_LOCAL_PATH="./uploads"

# Production
APP_ENV="production"
```

### 3. Build and start

```bash
# Build images (takes a few minutes first time)
docker compose -f docker-compose.prod.yml build

# Run database migrations
docker compose -f docker-compose.prod.yml run --rm migrate

# Seed the free plan (first time only)
docker compose -f docker-compose.prod.yml run --rm worker npx tsx prisma/seed.ts

# Start everything in background
docker compose -f docker-compose.prod.yml up -d
```

This starts 4 services:

| Service | Purpose |
|---|---|
| `app` | Next.js production server (port 3000) |
| `worker` | Background job processor (PDF text extraction, thumbnails) |
| `postgres` | PostgreSQL 16 database |
| `redis` | Redis 7 for job queue + caching |

### 4. Setup Nginx reverse proxy

Install Nginx:

```bash
sudo apt-get update
sudo apt-get install nginx certbot python3-certbot-nginx -y
```

Create `/etc/nginx/sites-available/pdf-annotator`:

```nginx
server {
    listen 80;
    server_name your-server-ip yourdomain.com;  # Use your VPS IP or domain

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/pdf-annotator /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**For SSL with domain (optional):**

```bash
# Get free SSL certificate (auto-configures Nginx)
sudo certbot --nginx -d yourdomain.com
```

**For IP-only access:** Skip SSL setup. The app will be accessible at `http://your-server-ip`

### 5. Update Google OAuth redirect URI

In Google Cloud Console, update the authorized redirect URI:

**With domain:**
```
https://yourdomain.com/api/auth/callback/google
```

**With IP only:**
```
http://your-server-ip/api/auth/callback/google
```

Also update `APP_URL` and `NEXTAUTH_URL` in `.env` to match your IP or domain.

### 6. Verify deployment

```bash
# Check all 4 services are running (app, worker, postgres, redis)
docker compose -f docker-compose.prod.yml ps

# Check app responds locally
curl http://localhost:3000

# Check Nginx is running
sudo systemctl status nginx

# View application logs
docker compose -f docker-compose.prod.yml logs -f app worker
```

**Access the app:**
- With domain: `http://yourdomain.com` or `https://yourdomain.com` (if SSL configured)
- With IP: `http://your-server-ip`

All services (database, backend, frontend, worker) are now running and accessible through Nginx.

---

## Production Commands Reference

### Service management

| Command | Purpose |
|---|---|
| `docker compose -f docker-compose.prod.yml up -d` | Start all services |
| `docker compose -f docker-compose.prod.yml down` | Stop all services |
| `docker compose -f docker-compose.prod.yml restart app` | Restart just the app |
| `docker compose -f docker-compose.prod.yml restart worker` | Restart just the worker |
| `docker compose -f docker-compose.prod.yml ps` | Check service status |

### Logs

| Command | Purpose |
|---|---|
| `docker compose -f docker-compose.prod.yml logs -f app` | App logs (live) |
| `docker compose -f docker-compose.prod.yml logs -f worker` | Worker logs (live) |
| `docker compose -f docker-compose.prod.yml logs -f app worker` | Both app + worker logs |
| `docker compose -f docker-compose.prod.yml logs --tail 100 app` | Last 100 lines of app logs |

### Database

| Command | Purpose |
|---|---|
| `docker compose -f docker-compose.prod.yml exec postgres psql -U postgres pdf_annotator` | Open PostgreSQL shell |
| `docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres pdf_annotator > backup.sql` | Backup database to file |
| `docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres pdf_annotator < backup.sql` | Restore database from file |
| `docker compose -f docker-compose.prod.yml run --rm migrate` | Run pending migrations |

### Redis

| Command | Purpose |
|---|---|
| `docker compose -f docker-compose.prod.yml exec redis redis-cli` | Open Redis shell |
| `docker compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL` | Clear all Redis data (queues + cache) |
| `docker compose -f docker-compose.prod.yml exec redis redis-cli INFO` | Redis server info |

### Updating the app

```bash
cd pdf-annotator
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm migrate
docker compose -f docker-compose.prod.yml up -d
```

### Rebuilding from scratch

```bash
# Stop everything
docker compose -f docker-compose.prod.yml down

# Rebuild without cache
docker compose -f docker-compose.prod.yml build --no-cache

# Start fresh
docker compose -f docker-compose.prod.yml run --rm migrate
docker compose -f docker-compose.prod.yml up -d
```

### Danger zone

| Command | Purpose |
|---|---|
| `docker compose -f docker-compose.prod.yml down -v` | Stop and DELETE all data (database, redis, uploads) |
| `docker system prune -a` | Remove all unused Docker images (frees disk) |

---

## Oracle Cloud Firewall

Oracle Cloud blocks ports 80/443 by default. Open them in **both** places:

### 1. OS firewall (iptables)

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

### 2. VCN Security List

In Oracle Cloud Console:

1. Go to **Networking** → **Virtual Cloud Networks** → your VCN
2. Click **Security Lists** → **Default Security List**
3. Add **Ingress Rules**:
   - Source CIDR: `0.0.0.0/0`, Protocol: TCP, Destination Port: `80`
   - Source CIDR: `0.0.0.0/0`, Protocol: TCP, Destination Port: `443`

---

## Troubleshooting

### Worker not processing documents

- Check worker is running: `docker compose -f docker-compose.prod.yml ps worker`
- Check worker logs: `docker compose -f docker-compose.prod.yml logs -f worker`
- Re-queue failed jobs: `docker compose -f docker-compose.prod.yml exec worker npx tsx scripts/requeue-failed.ts`

### App can't connect to database

- Check postgres is healthy: `docker compose -f docker-compose.prod.yml ps postgres`
- Check `DATABASE_URL` matches `POSTGRES_PASSWORD` in `.env`
- Verify migrations ran: `docker compose -f docker-compose.prod.yml run --rm migrate`

### "502 Bad Gateway" from Nginx

- Check app is running: `docker compose -f docker-compose.prod.yml ps app`
- Check app logs: `docker compose -f docker-compose.prod.yml logs app`
- Test locally: `curl http://localhost:3000`

### Out of disk space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a
docker volume prune
```
