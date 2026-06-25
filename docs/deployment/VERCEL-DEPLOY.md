# Deploying to Vercel

Complete guide for deploying PDF Annotator to Vercel with external database services.

---

## Architecture

- **Vercel**: Next.js app (frontend + API routes)
- **External Database**: PostgreSQL (Neon, Supabase, or Railway)
- **External Redis**: Upstash Redis
- **VPS (Optional)**: Background worker for PDF processing

---

## Prerequisites

### 1. External PostgreSQL Database

Choose one:

**Option A: Neon (Recommended)**
1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Copy the connection string (starts with `postgresql://`)
4. Use the pooled connection string for `DATABASE_URL`
5. Use the direct connection string for `DIRECT_URL`

**Option B: Supabase**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (Connection pooling mode)
5. Use for both `DATABASE_URL` and `DIRECT_URL`

**Option C: Railway**
1. Go to [railway.app](https://railway.app)
2. Create a new project → Add PostgreSQL
3. Copy the connection string from Variables tab

### 2. External Redis

**Upstash Redis (Recommended)**
1. Go to [upstash.com](https://upstash.com)
2. Sign up and create a Redis database
3. Choose a region close to your Vercel deployment
4. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

Your Redis URL format:
```
redis://default:YOUR_TOKEN@YOUR_ENDPOINT:6379
```

Or use Upstash REST API (better for serverless):
```
https://YOUR_ENDPOINT.upstash.io
```

---

## Deployment Steps

### 1. Push code to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Import project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select "pdf-annotator"

### 3. Configure Environment Variables

In Vercel project settings, add these environment variables:

```bash
# Database (from Neon/Supabase/Railway)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/database?sslmode=require

# Redis (from Upstash)
REDIS_URL=redis://default:token@endpoint:6379

# Auth
AUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=https://your-app.vercel.app
APP_URL=https://your-app.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Storage (use S3 for production)
STORAGE_DRIVER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your-bucket-name

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Environment
APP_ENV=production
NODE_ENV=production
```

### 4. Update Google OAuth

Add Vercel callback URL to Google Cloud Console:

1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add authorized redirect URI:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

### 5. Run Database Migrations

After first deployment, run migrations:

**Option A: From local machine**
```bash
# Set DATABASE_URL to your production database
export DATABASE_URL="your_production_database_url"

# Run migrations
pnpm db:deploy

# Seed the database
pnpm db:seed
```

**Option B: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Run migration command
vercel env pull .env.production
pnpm db:deploy
pnpm db:seed
```

### 6. Deploy

Click "Deploy" in Vercel dashboard or push to GitHub:

```bash
git push origin main
```

Vercel will automatically build and deploy.

---

## Background Worker Setup

⚠️ **Important**: Vercel doesn't run background workers. You need to run the worker separately.

### Option A: Run worker on VPS with PM2

Follow `RUNNING-PM2.md` but only run the worker:

```bash
# On your VPS
cd ~/pdf-annotator
git pull

# Create .env with production database URLs
nano .env

# Install dependencies
pnpm install

# Start only the worker with PM2
pm2 start ecosystem.config.js --only pdf-annotator-worker
pm2 save
```

Update `ecosystem.config.js` to only include worker:

```javascript
module.exports = {
  apps: [
    {
      name: 'pdf-annotator-worker',
      script: 'node_modules/.bin/tsx',
      args: 'lib/jobs/worker.ts',
      cwd: '/home/ubuntu/pdf-annotator',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'your_production_database_url',
        REDIS_URL: 'your_production_redis_url'
      }
    }
  ]
};
```

### Option B: Use Vercel Cron + API Routes (Limited)

For lightweight background tasks, use Vercel Cron:

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-documents",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs every 5 minutes but has 10-second timeout limit.

---

## Storage Configuration

### Using AWS S3 (Recommended for Production)

1. Create S3 bucket in AWS Console
2. Create IAM user with S3 permissions
3. Add environment variables to Vercel:

```bash
STORAGE_DRIVER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
```

### Using Vercel Blob Storage

1. Enable Vercel Blob in project settings
2. Update environment variables:

```bash
STORAGE_DRIVER=vercel-blob
BLOB_READ_WRITE_TOKEN=auto_generated_by_vercel
```

---

## Vercel Configuration Files

### vercel.json (already created)

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

### package.json (already updated)

The `postinstall` script ensures Prisma client is generated:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

---

## Testing Deployment

### 1. Check build logs

In Vercel dashboard, check the deployment logs for errors.

### 2. Test the app

Visit your Vercel URL: `https://your-app.vercel.app`

### 3. Test authentication

Try logging in with Google OAuth.

### 4. Test file upload

Upload a PDF and check if it processes (requires worker running).

### 5. Check database

```bash
# Connect to your production database
psql "your_production_database_url"

# Check users
SELECT * FROM "User";

# Check documents
SELECT * FROM "Document";
```

---

## Troubleshooting

### Build fails with Prisma error

Make sure `postinstall` script is in `package.json`:
```json
"postinstall": "prisma generate"
```

### Database connection fails

- Check `DATABASE_URL` includes `?sslmode=require` for Neon/Supabase
- Verify the connection string is correct
- Check database is accessible from Vercel's IP ranges

### Redis connection fails

- Use Upstash REST API instead of Redis protocol for serverless
- Update Redis client configuration for serverless

### Worker not processing documents

- Make sure worker is running on VPS with PM2
- Check worker logs: `pm2 logs pdf-annotator-worker`
- Verify worker can connect to production database and Redis

### File uploads fail

- Check storage configuration (S3 credentials)
- Verify bucket permissions
- Check Vercel function size limits (50MB max)

---

## Cost Estimation

### Free Tier Limits

**Vercel:**
- 100GB bandwidth/month
- 100 hours serverless function execution
- 1000 serverless function invocations/day

**Neon (PostgreSQL):**
- 0.5GB storage
- 1 project
- Unlimited queries

**Upstash (Redis):**
- 10,000 commands/day
- 256MB storage

**AWS S3:**
- 5GB storage
- 20,000 GET requests
- 2,000 PUT requests

### Recommended Setup for Production

- **Vercel Pro**: $20/month (better limits)
- **Neon Scale**: $19/month (more storage)
- **Upstash Pro**: $10/month (more commands)
- **AWS S3**: Pay as you go (~$1-5/month for small apps)
- **VPS for worker**: $5-10/month (DigitalOcean, Hetzner)

**Total**: ~$55-65/month for production-ready setup

---

## Alternative: Full VPS Deployment

If you prefer simpler setup and lower cost, deploy everything on VPS:

- Follow `RUNNING-PM2.md` instead
- Run Next.js app + worker on same VPS
- Use native PostgreSQL + Redis
- Cost: $5-10/month for 2GB RAM VPS

**Pros:**
- Simpler architecture
- Lower cost
- Full control

**Cons:**
- Manual scaling
- No automatic deployments
- Need to manage server

---

## Deployment Checklist

- [ ] External PostgreSQL database created (Neon/Supabase/Railway)
- [ ] External Redis created (Upstash)
- [ ] All environment variables added to Vercel
- [ ] Google OAuth redirect URI updated
- [ ] Code pushed to GitHub
- [ ] Project imported to Vercel
- [ ] Database migrations run (`pnpm db:deploy`)
- [ ] Database seeded (`pnpm db:seed`)
- [ ] Worker running on VPS (if using PM2)
- [ ] Storage configured (S3 or Vercel Blob)
- [ ] App accessible and login works
- [ ] PDF upload and processing works

---

## Updating Deployed App

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Vercel auto-deploys on push

# If schema changed, run migrations
pnpm db:deploy

# Update worker on VPS
ssh your-vps
cd ~/pdf-annotator
git pull
pnpm install
pm2 restart pdf-annotator-worker
```
