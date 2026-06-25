# Removing Docker from VPS

Complete guide to safely remove Docker and free up disk space and RAM.

---

## Before Removing Docker

### 1. Backup any data from Docker volumes

If you have any important data in Docker containers or volumes, back it up first:

```bash
# List all volumes
docker volume ls

# Backup database if running in Docker
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres pdf_annotator > backup.sql

# Or if using default docker-compose.yml
docker compose exec postgres pg_dump -U postgres pdf_annotator > backup.sql
```

### 2. Stop and remove all containers

```bash
# Stop all running containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Or if using docker-compose
docker compose down
# or
docker compose -f docker-compose.prod.yml down

# Remove all volumes (WARNING: deletes all data)
docker compose down -v
# or
docker compose -f docker-compose.prod.yml down -v
```

---

## Removing Docker (Ubuntu/Debian)

### Method 1: Complete removal (recommended)

```bash
# Stop Docker service
sudo systemctl stop docker
sudo systemctl stop docker.socket
sudo systemctl stop containerd

# Remove Docker packages
sudo apt-get purge docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-ce-rootless-extras -y

# Remove all Docker data, images, containers, volumes
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd

# Remove Docker configuration
sudo rm -rf /etc/docker
sudo rm -rf ~/.docker

# Remove Docker group
sudo groupdel docker

# Clean up unused packages
sudo apt-get autoremove -y
sudo apt-get autoclean
```

### Method 2: If installed via snap

```bash
# Check if Docker is installed via snap
snap list | grep docker

# Remove if found
sudo snap remove docker
```

### Method 3: If installed via get.docker.com script

```bash
# Uninstall Docker
sudo apt-get purge docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
sudo apt-get autoremove -y
```

---

## Verify Removal

```bash
# Check Docker is not running
docker --version
# Should show: command not found

# Check no Docker processes
ps aux | grep docker
# Should show nothing (except the grep command itself)

# Check disk space freed
df -h

# Check memory
free -h
```

---

## Clean Up Remaining Files

```bash
# Remove any remaining Docker files
sudo rm -rf /var/run/docker.sock
sudo rm -rf /usr/local/bin/docker-compose
sudo rm -rf /usr/libexec/docker
sudo rm -rf /usr/bin/docker*

# Remove systemd service files
sudo rm -rf /etc/systemd/system/docker.service
sudo rm -rf /etc/systemd/system/docker.socket
sudo rm -rf /lib/systemd/system/docker.service
sudo rm -rf /lib/systemd/system/docker.socket

# Reload systemd
sudo systemctl daemon-reload
```

---

## Free Up Additional Disk Space

After removing Docker, clean up the system:

```bash
# Remove unused packages
sudo apt-get autoremove -y

# Clean package cache
sudo apt-get autoclean
sudo apt-get clean

# Remove old kernels (keep current and one previous)
sudo apt-get autoremove --purge -y

# Check disk usage
df -h

# Find large files (optional)
sudo du -h --max-depth=1 / 2>/dev/null | sort -hr | head -20
```

---

## Restore Data to Native PostgreSQL (if needed)

If you backed up data from Docker PostgreSQL and need to restore to native PostgreSQL:

```bash
# Make sure native PostgreSQL is installed and running
sudo systemctl status postgresql

# Restore the backup
psql -U pdf_user -d pdf_annotator < backup.sql

# Or as postgres user
sudo -u postgres psql pdf_annotator < backup.sql
```

---

## Expected Space Savings

After removing Docker, you should free up:

- **Docker images**: 500MB - 2GB
- **Docker containers**: 100MB - 500MB
- **Docker volumes**: Varies (database data, etc.)
- **Docker system files**: 100MB - 300MB
- **Total**: Typically 1GB - 3GB+

Check before and after:

```bash
# Before removal
df -h

# After removal and cleanup
df -h
```

---

## Troubleshooting

### "Device or resource busy" error

```bash
# Find what's using Docker
sudo lsof | grep docker

# Force unmount if needed
sudo umount /var/lib/docker/overlay2

# Then try removal again
sudo rm -rf /var/lib/docker
```

### Docker group still exists

```bash
# Check if group exists
getent group docker

# Remove it
sudo groupdel docker

# Remove user from docker group (if needed)
sudo deluser $USER docker
```

### Systemd still trying to start Docker

```bash
# Disable Docker services
sudo systemctl disable docker
sudo systemctl disable docker.socket
sudo systemctl disable containerd

# Remove service files
sudo rm -rf /etc/systemd/system/docker.service.d
sudo rm -rf /etc/systemd/system/docker.socket.d

# Reload systemd
sudo systemctl daemon-reload
sudo systemctl reset-failed
```

---

## Quick One-Liner (Nuclear Option)

⚠️ **WARNING**: This removes everything Docker-related without backup. Use only if you're sure.

```bash
sudo systemctl stop docker docker.socket containerd && \
sudo apt-get purge docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y && \
sudo rm -rf /var/lib/docker /var/lib/containerd /etc/docker ~/.docker && \
sudo groupdel docker 2>/dev/null; \
sudo apt-get autoremove -y && \
sudo apt-get autoclean && \
echo "Docker removed successfully"
```

---

## After Removal Checklist

- [ ] Docker command not found: `docker --version`
- [ ] No Docker processes: `ps aux | grep docker`
- [ ] Docker directories removed: `ls /var/lib/docker`
- [ ] Disk space freed: `df -h`
- [ ] Native PostgreSQL running: `sudo systemctl status postgresql`
- [ ] Native Redis running: `sudo systemctl status redis-server`
- [ ] PM2 processes running: `pm2 status`
- [ ] App accessible via browser

---

## Next Steps

After removing Docker, follow the **RUNNING-PM2.md** guide to set up your app with PM2, native PostgreSQL, and Redis.
