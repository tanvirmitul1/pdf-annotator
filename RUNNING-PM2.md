# Running PDF Annotator with PM2 (No Docker)

For servers with limited RAM (1GB), running PostgreSQL and Redis natively with PM2 is more efficient than Docker.

---

## Local Development (No Docker)

### Prerequisites

- [Node.js 20+](https://nodejs.org)
- [pnpm](https://pnpm.io) — `npm i -g pnpm`
- [PostgreSQL 14+](https://www.postgresql.org/download/)
- [Redis 6+](https://redis.io/download)

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download installer from https://www.postgresql.org/download/windows/

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

### 2. Install Redis

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Windows:**
Download from https://github.com/microsoftarchive/redis/releases

**macOS:**
```bash
brew install redis
brew services start redis
```

### 3. Create database

```bash
# Switch to postgres user (Linux/macOS)
sudo -u postgres psql

# Or just run psql (Windows/macOS with default setup)
psql -U postgres
```

In PostgreSQL shell:
```sql
CREATE DATABASE pdf_annotator;
CREATE USER pdf_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE pdf_annotator TO pdf_user;
\q
```

### 4. Environment setup

```bash
cp .env.example .env
nano .env
```

Update `.env`:
```bash
DATABASE_URL="postgresql://pdf_user:your_password_here@localhost:5432/pdf_annotator?schema=public"
DIRECT_URL="postgresql://pdf_user:your_password_here@localhost:5432/pdf_annotator?schema=public"
REDIS_URL="redis://localhost:6379"

AUTH_SECRET="run-openssl-rand-base64-32"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Install dependencies

```bash
pnpm install
```

### 6. Setup database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 7. Start development

```bash
# Run both Next.js + worker
pnpm dev:all
```

App runs at **http://localhost:3000**

---

## Production Deployment with PM2

### 1. Server setup (Ubuntu VPS)

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
sudo apt-get install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install Nginx
sudo apt-get install nginx certbot python3-certbot-nginx -y
```

### 2. Configure PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE pdf_annotator;
CREATE USER pdf_user WITH PASSWORD 'strong_production_password';
GRANT ALL PRIVILEGES ON DATABASE pdf_annotator TO pdf_user;
\q
```

### 3. Secure Redis (optional but recommended)

```bash
sudo nano /etc/redis/redis.conf
```

Add/update:
```
requirepass your_redis_password
```

Restart Redis:
```bash
sudo systemctl restart redis-server
```

### 4. Clone and configure app

```bash
cd ~
git clone https://github.com/tanvirmitul1/pdf-annotator.git
cd pdf-annotator

cp .env.example .env
nano .env
```

Production `.env`:
```bash
DATABASE_URL="postgresql://pdf_user:strong_production_password@localhost:5432/pdf_annotator?schema=public"
DIRECT_URL="postgresql://pdf_user:strong_production_password@localhost:5432/pdf_annotator?schema=public"
REDIS_URL="redis://:your_redis_password@localhost:6379"

AUTH_SECRET="generate-with-openssl-rand-base64-32"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

APP_URL="https://yourdomain.com"
NEXTAUTH_URL="https://yourdomain.com"

STORAGE_DRIVER="local"
STORAGE_LOCAL_PATH="./uploads"

APP_ENV="production"
NODE_ENV="production"
```

### 5. Build and setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Build production app
pnpm build
```

### 6. Create PM2 ecosystem file

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'pdf-annotator-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/home/ubuntu/pdf-annotator',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'pdf-annotator-worker',
      script: 'node_modules/.bin/tsx',
      args: 'src/worker/index.ts',
      cwd: '/home/ubuntu/pdf-annotator',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

### 7. Create logs directory

```bash
mkdir -p logs
```

### 8. Start with PM2

```bash
# Start both app and worker
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs (starts with sudo)
```

### 9. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/pdf-annotator
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

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

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/pdf-annotator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 10. Setup SSL (optional)

```bash
sudo certbot --nginx -d yourdomain.com
```

### 11. Update Google OAuth

Add redirect URI in Google Cloud Console:
```
https://yourdomain.com/api/auth/callback/google
```

---

## PM2 Commands

### Process management

| Command | Purpose |
|---|---|
| `pm2 start ecosystem.config.js` | Start all processes |
| `pm2 stop all` | Stop all processes |
| `pm2 restart all` | Restart all processes |
| `pm2 restart pdf-annotator-app` | Restart just the app |
| `pm2 restart pdf-annotator-worker` | Restart just the worker |
| `pm2 delete all` | Remove all processes |
| `pm2 list` | List all processes |

### Monitoring

| Command | Purpose |
|---|---|
| `pm2 status` | Process status overview |
| `pm2 logs` | View all logs (live) |
| `pm2 logs pdf-annotator-app` | View app logs only |
| `pm2 logs pdf-annotator-worker` | View worker logs only |
| `pm2 logs --lines 100` | View last 100 lines |
| `pm2 monit` | Real-time monitoring dashboard |
| `pm2 flush` | Clear all logs |

### System

| Command | Purpose |
|---|---|
| `pm2 save` | Save current process list |
| `pm2 resurrect` | Restore saved process list |
| `pm2 startup` | Generate startup script |
| `pm2 unstartup` | Remove startup script |

---

## Database Commands

### PostgreSQL

| Command | Purpose |
|---|---|
| `sudo -u postgres psql pdf_annotator` | Open database shell |
| `pg_dump -U pdf_user pdf_annotator > backup.sql` | Backup database |
| `psql -U pdf_user pdf_annotator < backup.sql` | Restore database |
| `sudo systemctl status postgresql` | Check PostgreSQL status |
| `sudo systemctl restart postgresql` | Restart PostgreSQL |

### Redis

| Command | Purpose |
|---|---|
| `redis-cli` | Open Redis shell |
| `redis-cli -a your_redis_password` | Open Redis shell (with password) |
| `redis-cli FLUSHALL` | Clear all Redis data |
| `redis-cli INFO` | Redis server info |
| `sudo systemctl status redis-server` | Check Redis status |
| `sudo systemctl restart redis-server` | Restart Redis |

---

## Updating the App

```bash
cd ~/pdf-annotator

# Pull latest code
git pull

# Install new dependencies
pnpm install

# Regenerate Prisma client
pnpm db:generate

# Run new migrations
pnpm db:migrate

# Rebuild
pnpm build

# Restart PM2 processes
pm2 restart all
```

---

## Troubleshooting

### Check service status

```bash
# PostgreSQL
sudo systemctl status postgresql

# Redis
sudo systemctl status redis-server

# PM2 processes
pm2 status

# Nginx
sudo systemctl status nginx
```

### View logs

```bash
# PM2 logs
pm2 logs

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Worker not processing

```bash
# Check worker is running
pm2 list

# View worker logs
pm2 logs pdf-annotator-worker

# Restart worker
pm2 restart pdf-annotator-worker

# Re-queue failed jobs
cd ~/pdf-annotator
pnpm tsx scripts/requeue-failed.ts
```

### Database connection issues

```bash
# Test PostgreSQL connection
psql -U pdf_user -d pdf_annotator -h localhost

# Check if PostgreSQL is listening
sudo netstat -plnt | grep 5432

# Verify DATABASE_URL in .env matches credentials
```

### Out of memory

```bash
# Check memory usage
free -h

# Check PM2 memory usage
pm2 monit

# Reduce PM2 instances in ecosystem.config.js (set instances: 1)
# Restart PostgreSQL to free memory
sudo systemctl restart postgresql
```

### Port already in use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>
```

---

## Memory Optimization for 1GB RAM

### PostgreSQL tuning

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Add/update:
```
shared_buffers = 128MB
effective_cache_size = 256MB
maintenance_work_mem = 32MB
work_mem = 4MB
max_connections = 20
```

Restart:
```bash
sudo systemctl restart postgresql
```

### Redis tuning

```bash
sudo nano /etc/redis/redis.conf
```

Add/update:
```
maxmemory 128mb
maxmemory-policy allkeys-lru
```

Restart:
```bash
sudo systemctl restart redis-server
```

### PM2 optimization

In `ecosystem.config.js`, keep `instances: 1` for both processes to minimize memory usage.

---

## Oracle Cloud Firewall

```bash
# Open ports 80 and 443
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

Also add ingress rules in Oracle Cloud Console VCN Security List for ports 80 and 443.
