# Free SSL & Custom Domain Setup — Oracle Cloud VPS

Complete step-by-step guide for setting up a free subdomain (DuckDNS) with free SSL (Let's Encrypt) on an Oracle Cloud free-tier VPS.

---

## Overview

```
DuckDNS (free subdomain)          Let's Encrypt (free SSL)         Nginx (reverse proxy)
─────────────────────────         ──────────────────────           ────────────────────
pdf-annotation.duckdns.org  ───►  SSL certificate (auto-renew) ──► proxy to localhost:3000
Points to your VPS IP             Valid 90 days, Certbot renews    Handles HTTPS termination
```

**Cost:** $0. DuckDNS is free, Let's Encrypt is free, Nginx is free.

---

## Prerequisites

- Oracle Cloud VPS (free tier) with a public IP
- SSH access to the VPS
- An app running on `localhost:3000` (or any port)

---

## Step 1 — Get a Free Subdomain from DuckDNS

1. Go to [https://www.duckdns.org](https://www.duckdns.org)
2. Sign in with Google/GitHub/Reddit/Twitter
3. In the "sub domain" field, type your desired name (e.g., `pdf-annotation`)
4. Click **add domain**
5. Set the IP to your VPS public IP (e.g., `40.233.127.60`)
6. Click **update ip**

**Verify DNS is working:**

```bash
ping pdf-annotation.duckdns.org
```

Should resolve to your VPS IP. DNS propagation is usually instant with DuckDNS.

---

## Step 2 — Open Firewall Ports on Oracle Cloud

Oracle Cloud has **two layers of firewall**. You must open ports in BOTH.

### Layer 1: Oracle Cloud Security List (cloud console)

1. Go to [Oracle Cloud Console](https://cloud.oracle.com)
2. Navigate to: **Networking → Virtual Cloud Networks → your VCN → Subnets → your Subnet → Security Lists → Default Security List**
3. Click **Add Ingress Rules**
4. Add these two rules:

| Source CIDR | Protocol | Dest Port | Description |
|---|---|---|---|
| `0.0.0.0/0` | TCP | `80` | HTTP |
| `0.0.0.0/0` | TCP | `443` | HTTPS |

5. Click **Add Ingress Rules**

### Layer 2: iptables (OS-level firewall)

SSH into your VPS and run:

```bash
# Check existing rules
sudo iptables -L INPUT -n --line-numbers

# Add port 80 (HTTP) — insert at position 6, before the REJECT rule
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT

# Add port 443 (HTTPS)
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# Save so rules survive reboot
sudo netfilter-persistent save
```

**Verify ports are open:**

```bash
sudo iptables -L INPUT -n | grep -E '(80|443)'
```

You should see two ACCEPT lines for ports 80 and 443.

> **Important:** If you skip either layer, connections will be refused. This is the #1 cause of "site can't be reached" errors on Oracle Cloud.

---

## Step 3 — Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

**Verify Nginx is running:**

```bash
curl -I http://localhost:80
```

Should return `200 OK` with nginx headers.

---

## Step 4 — Configure Nginx as Reverse Proxy

Create the site config:

```bash
sudo tee /etc/nginx/sites-available/pdf-annotator > /dev/null << 'EOF'
server {
    listen 80;
    server_name pdf-annotation.duckdns.org;

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
        client_max_body_size 50M;
    }
}
EOF
```

Enable the site and reload:

```bash
# Create symlink to enable the site
sudo ln -sf /etc/nginx/sites-available/pdf-annotator /etc/nginx/sites-enabled/pdf-annotator

# Remove default site if present (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test config and reload
sudo nginx -t && sudo systemctl reload nginx
```

**Verify HTTP is working:**

```bash
curl -I http://pdf-annotation.duckdns.org
```

Should return `200 OK`. If this fails, fix it before proceeding to SSL.

---

## Step 5 — Install Certbot (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## Step 6 — Obtain SSL Certificate

```bash
sudo certbot --nginx -d pdf-annotation.duckdns.org
```

- Enter your email when prompted
- Agree to terms of service
- Choose whether to share email with EFF

If successful, Certbot automatically:
- Obtains the certificate
- Updates your Nginx config to listen on 443 with SSL
- Sets up HTTP → HTTPS redirect
- Configures auto-renewal

### Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `Connection refused` / `timeout during connect` | Port 80 blocked | Open port 80 in both Oracle Security List AND iptables (Step 2) |
| `DNS problem: query timed out looking up CAA` | DuckDNS DNS hiccup | **Retry the command 2-3 times** — this is transient |
| `Could not automatically find a matching server block` | Nginx site not enabled or `server_name` mismatch | Ensure the site is symlinked in `sites-enabled/` and `server_name` matches your domain |

### If Certbot Can't Auto-Configure Nginx

If you see "certificate was saved but could not be installed", do it manually:

```bash
sudo tee /etc/nginx/sites-available/pdf-annotator > /dev/null << 'EOF'
server {
    listen 80;
    server_name pdf-annotation.duckdns.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name pdf-annotation.duckdns.org;

    ssl_certificate /etc/letsencrypt/live/pdf-annotation.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pdf-annotation.duckdns.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

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
        client_max_body_size 50M;
    }
}
EOF

sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 7 — Verify HTTPS

```bash
# Check Nginx is listening on 443
sudo ss -tlnp | grep 443

# Test HTTPS
curl -I https://pdf-annotation.duckdns.org
```

Open `https://pdf-annotation.duckdns.org` in your browser — you should see a padlock icon.

---

## Step 8 — Update App Environment Variables

After SSL is working, update your app's `.env` to use HTTPS URLs.

```bash
nano /var/www/pdf-annotator/.env
```

You MUST update/add ALL of these variables. Missing any of them will cause auth failures:

```env
# --- Update existing values ---
APP_URL=https://pdf-annotation.duckdns.org
NEXTAUTH_URL=https://pdf-annotation.duckdns.org

# --- Add these if missing (Auth.js v5 requires them) ---
AUTH_URL=https://pdf-annotation.duckdns.org
AUTH_SECRET=<same value as NEXTAUTH_SECRET>
AUTH_TRUST_HOST=true
```

### Why each variable matters

| Variable | Why it's needed |
|---|---|
| `APP_URL` | Used by the app for generating absolute URLs |
| `NEXTAUTH_URL` | Legacy Auth.js variable — still read by some code paths |
| `AUTH_URL` | **Auth.js v5 uses this** to build OAuth `redirect_uri`. If missing, Auth.js may fall back to the raw IP address, causing Google/GitHub OAuth to reject the callback |
| `AUTH_SECRET` | Auth.js v5 uses `AUTH_SECRET`, NOT `NEXTAUTH_SECRET`. If missing, session signing fails |
| `AUTH_TRUST_HOST` | Required when running behind a reverse proxy (Nginx). Without it, Auth.js rejects requests with `UntrustedHost` error |

### How to get AUTH_SECRET value

Use the same value as `NEXTAUTH_SECRET`:

```bash
# Check your existing NEXTAUTH_SECRET
grep "NEXTAUTH_SECRET" /var/www/pdf-annotator/.env

# Copy that value and set AUTH_SECRET to the same thing
# Example (use YOUR actual value, not this one):
# AUTH_SECRET=8DtXnGJTTNJQuFvwRodGmT3l2yUpZuZgReSqUgS9jX4vN+n+SZ/5vCiNGYPHOquB
```

### Verify all auth variables are set

After editing, verify nothing is missing:

```bash
grep -E "^(APP_URL|NEXTAUTH_URL|NEXTAUTH_SECRET|AUTH_URL|AUTH_SECRET|AUTH_TRUST_HOST)=" /var/www/pdf-annotator/.env
```

You should see all 6 variables. If any are missing, add them.

### Common mistakes

| Mistake | Symptom | Fix |
|---|---|---|
| `AUTH_SECRET` missing | Logs show `AUTH_SECRET: MISSING` | Add `AUTH_SECRET=<your NEXTAUTH_SECRET value>` |
| `AUTH_URL` missing | Google OAuth error: `redirect_uri=http://40.233.127.60:3000/...` (uses raw IP instead of domain) | Add `AUTH_URL=https://pdf-annotation.duckdns.org` |
| `AUTH_TRUST_HOST` missing | `UntrustedHost` error in logs | Add `AUTH_TRUST_HOST=true` |
| Duplicate entries in `.env` | Unpredictable behavior (last value wins) | Run `sort /var/www/pdf-annotator/.env \| uniq -d -f0` to find duplicates |
| Placeholder value like `<paste value here>` | Auth completely broken | Replace with actual value, no angle brackets |

### Restart after changes

```bash
pm2 restart pdf-annotator --update-env
pm2 logs pdf-annotator --lines 20
```

Check the logs — you should see:
- `AUTH_SECRET: set` (not `MISSING`)
- No `UntrustedHost` errors
- `Ready in X.Xs`

---

## Step 9 — Update OAuth Callback URLs

Your OAuth providers must use the HTTPS domain URL, not the raw IP. If they don't match exactly, Google/GitHub will reject the login with "Authorization Error" or "redirect_uri mismatch".

### Google Cloud Console
1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Update **Authorized JavaScript origins**:
   - `https://pdf-annotation.duckdns.org`
4. Update **Authorized redirect URIs**:
   - `https://pdf-annotation.duckdns.org/api/auth/callback/google`
5. **Remove** any old entries pointing to `http://40.233.127.60:3000`
6. Keep `http://localhost:3000` for local development

> **Note:** Google OAuth changes can take 5-10 minutes to propagate. If login still fails immediately after updating, wait and retry.

### GitHub Developer Settings
1. Go to [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Edit your OAuth App
3. Update **Homepage URL**: `https://pdf-annotation.duckdns.org`
4. Update **Authorization callback URL**: `https://pdf-annotation.duckdns.org/api/auth/callback/github`

### How to debug OAuth redirect issues

If Google/GitHub login fails with "redirect_uri mismatch" or "Authorization Error":

```bash
# 1. Check what redirect_uri your app is sending
pm2 logs pdf-annotator --lines 50 | grep -i "redirect\|callback\|oauth"

# 2. The error page usually shows the actual redirect_uri being sent, e.g.:
#    redirect_uri=http://40.233.127.60:3000/api/auth/callback/google
#
# This means AUTH_URL/NEXTAUTH_URL is still pointing to the old IP.
# Fix it in .env and restart.

# 3. Verify your .env has the correct values
grep -E "AUTH_URL|NEXTAUTH_URL|APP_URL" /var/www/pdf-annotator/.env
```

The `redirect_uri` your app sends MUST exactly match one of the URIs registered in Google/GitHub. No trailing slashes, no http vs https mismatch, no IP vs domain mismatch.

---

## Certificate Renewal

Let's Encrypt certificates expire every 90 days. Certbot sets up automatic renewal via a systemd timer.

**Verify auto-renewal is configured:**

```bash
sudo systemctl status certbot.timer
```

**Test renewal (dry run):**

```bash
sudo certbot renew --dry-run
```

**Manual renewal (if ever needed):**

```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## Adding More Subdomains

To add another app on the same VPS (e.g., `my-other-app.duckdns.org`):

1. **Add subdomain on DuckDNS** — point it to the same VPS IP

2. **Create Nginx config:**

```bash
sudo tee /etc/nginx/sites-available/my-other-app > /dev/null << 'EOF'
server {
    listen 80;
    server_name my-other-app.duckdns.org;

    location / {
        proxy_pass http://127.0.0.1:4000;  # different port
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
EOF

sudo ln -sf /etc/nginx/sites-available/my-other-app /etc/nginx/sites-enabled/my-other-app
sudo nginx -t && sudo systemctl reload nginx
```

3. **Get SSL certificate:**

```bash
sudo certbot --nginx -d my-other-app.duckdns.org
```

Each subdomain gets its own Nginx server block and its own SSL certificate.

---

## Troubleshooting

### "Site can't be reached" / "Connection refused"

```bash
# 1. Check iptables
sudo iptables -L INPUT -n | grep -E '(80|443)'

# 2. Check Nginx is running and listening
sudo systemctl status nginx
sudo ss -tlnp | grep -E '(80|443)'

# 3. Check the site is enabled
ls -la /etc/nginx/sites-enabled/

# 4. Check Nginx config is valid
sudo nginx -t

# 5. Check Nginx error logs
sudo tail -20 /var/log/nginx/error.log
```

### "Certificate expired" or SSL warnings

```bash
# Check certificate expiry
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### DuckDNS IP not updating

If your VPS IP changes (rare on Oracle Cloud), update it:

```bash
# Manual update via API
curl "https://www.duckdns.org/update?domains=pdf-annotation&token=YOUR_DUCKDNS_TOKEN&ip="
```

Or set up a cron job for auto-updates:

```bash
# Add to crontab (updates every 5 minutes)
crontab -e
# Add this line:
*/5 * * * * curl -s "https://www.duckdns.org/update?domains=pdf-annotation&token=YOUR_DUCKDNS_TOKEN&ip=" > /dev/null 2>&1
```

---

## Quick Reference

| What | Command |
|---|---|
| Check SSL cert status | `sudo certbot certificates` |
| Renew all certs | `sudo certbot renew` |
| Test renewal | `sudo certbot renew --dry-run` |
| View Nginx config | `cat /etc/nginx/sites-available/pdf-annotator` |
| Test Nginx config | `sudo nginx -t` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Check open ports | `sudo iptables -L INPUT -n` |
| Check listening ports | `sudo ss -tlnp` |
| View Nginx logs | `sudo tail -50 /var/log/nginx/error.log` |
| Update DuckDNS IP | Visit [duckdns.org](https://www.duckdns.org) and click update |
