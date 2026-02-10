# Certificate Management App - Deployment Guide

Complete guide for deploying the Certificate Management App to an Ubuntu VPS with existing PM2 and Nginx.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Deployment](#quick-deployment)
- [Architecture](#architecture)
- [Configuration Files](#configuration-files)
- [Update Workflow](#update-workflow)
- [Troubleshooting](#troubleshooting)
- [Useful Commands](#useful-commands)

---

## Prerequisites

### Required
- Ubuntu 20.04+ VPS
- Root or sudo access
- 1GB+ RAM (2GB recommended)
- 20GB+ disk space

### What Gets Installed
- ✅ **Docker** (latest) - Runs PostgreSQL container
- ✅ **Docker Compose** (latest) - Container orchestration
- ✅ **Node.js 18** - JavaScript runtime (if not present/outdated)
- ✅ **Git** - Version control (if not present)

### Ports Used
| Port | Service | Access | Purpose |
|------|---------|--------|---------|
| 8080 | Frontend (Nginx) | Public | Certificate app UI |
| 3001 | API (PM2/Node.js) | Internal | Proxied through Nginx |
| 5433 | Database (Docker/PostgreSQL) | Internal | Not exposed externally |

**Note:** These ports are different from typical setups (80, 3000, 5432) to avoid conflicts with existing applications.

---

## Quick Deployment

### Step 1: Setup VPS (One-Time)

SSH to your VPS and run the minimal setup script:

```bash
# SSH to VPS
ssh root@YOUR_VPS_IP

# Download setup script
wget https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/main/deployment/setup-vps-minimal.sh

# Make executable and run
chmod +x setup-vps-minimal.sh
sudo ./setup-vps-minimal.sh

# Log out and back in (for Docker permissions)
exit
ssh root@YOUR_VPS_IP
```

**What this does:**
- Installs Docker & Docker Compose
- Installs/updates Node.js 18 LTS
- Opens port 8080 in firewall
- Creates application directory structure
- **Skips PM2 & Nginx** if already installed

### Step 2: Clone and Configure

```bash
# Navigate to app directory
cd /var/www/certificate-app

# Clone your repository
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git .

# Create environment file from example
cp .env.example .env

# Edit with your credentials
nano .env
```

**Environment Variables (.env):**
```env
# Database Configuration
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=certificate_db

# JWT Secret (32+ characters, random)
JWT_SECRET=your_very_long_random_jwt_secret_at_least_32_characters

# API Configuration
NODE_ENV=production
PORT=3001
DB_NAME=certificate_db
DB_USER=your_db_user
DB_PASSWORD=your_secure_password_here
DB_HOST=localhost
DB_PORT=5433
```

**Security Tips:**
- Use strong passwords (16+ characters)
- Generate random JWT secret: `openssl rand -base64 32`
- Never commit `.env` to git (already in `.gitignore`)

### Step 3: Deploy

```bash
# Still in /var/www/certificate-app
bash deployment/deploy-from-github.sh
```

**What this script does:**
1. Validates prerequisites (Docker, Node.js, PM2, Nginx)
2. Checks environment configuration
3. Builds Angular frontend for production
4. Installs API dependencies
5. Starts PostgreSQL in Docker container
6. Configures and starts PM2 process
7. Sets up Nginx configuration
8. Configures firewall
9. Verifies deployment

### Step 4: Access Your App

Visit: **http://YOUR_VPS_IP:8080**

---

## Architecture

```
Internet
   ↓
YOUR_VPS_IP:8080 (Nginx)
   ├─→ /          → Frontend (Angular static files)
   └─→ /api/*     → Proxy to API (localhost:3001)
                        ↓
                   PM2 (Node.js/Express)
                        ↓
                   PostgreSQL (Docker:5433)
```

**Key Points:**
- Nginx serves static frontend files
- Nginx proxies `/api/*` requests to the Node.js API
- API connects to PostgreSQL running in Docker
- All services isolated from your existing apps

---

## Configuration Files

### docker-compose.prod.yml
PostgreSQL container configuration:
- Container name: `certificate_db_prod`
- Port mapping: `5433:5432` (external:internal)
- Data persistence: `/var/lib/postgresql/certificate-app`
- Network: `certificate-app-network` (isolated)
- Health checks enabled

### ecosystem.config.js
PM2 process configuration:
- Process name: `certificate-api`
- Working directory: `/var/www/certificate-app/api`
- Port: 3001
- Environment: production
- Auto-restart on failure
- Logs: `/var/log/pm2/certificate-api-*.log`

### nginx-vps.conf
Nginx configuration:
- Listen on port 8080
- Server name: YOUR_VPS_IP
- Root: `/var/www/certificate-app/frontend`
- Proxy `/api` to `localhost:3001`
- Security headers (CORS, XSS protection, etc.)
- Gzip compression enabled
- Separate logs: `/var/log/nginx/certificate-app-*.log`

---

## Update Workflow

When you make changes to your application:

```bash
# 1. Local: Commit and push changes
git add .
git commit -m "Your changes description"
git push

# 2. VPS: Pull and redeploy
ssh root@YOUR_VPS_IP
cd /var/www/certificate-app
git pull
bash deployment/deploy-from-github.sh
```

The deployment script will:
- Rebuild frontend if changes detected
- Restart API with PM2
- Reload Nginx if configuration changed

---

## Troubleshooting

### Deployment Issues

#### Problem: API won't start
```bash
# Check logs
pm2 logs certificate-api --lines 50

# Check if port is available
sudo lsof -i :3001

# Restart API
pm2 restart certificate-api
```

#### Problem: Database connection failed
```bash
# Check if container is running
docker ps | grep certificate_db_prod

# Check database logs
docker logs certificate_db_prod

# Restart database
cd /var/www/certificate-app
docker-compose -f deployment/docker-compose.prod.yml restart
```

#### Problem: Frontend showing 404 or empty page
```bash
# Check if files exist
ls -la /var/www/certificate-app/frontend/

# Rebuild frontend
cd /var/www/certificate-app/frontend
npm run build
sudo cp -r dist/certificate-management-frontend/* /var/www/certificate-app/frontend/
sudo chown -R www-data:www-data /var/www/certificate-app/frontend

# Reload nginx
sudo systemctl reload nginx
```

#### Problem: 502 Bad Gateway
```bash
# API not running - check PM2
pm2 status
pm2 logs certificate-api

# Restart API
pm2 restart certificate-api

# Check nginx error logs
sudo tail -f /var/log/nginx/certificate-app-error.log
```

#### Problem: Port conflicts
```bash
# Check what's using a port
sudo lsof -i :8080
sudo lsof -i :3001
sudo lsof -i :5433

# If needed, change ports in configuration files:
# - deployment/nginx-vps.conf (listen 8080;)
# - deployment/ecosystem.config.js (PORT: 3001)
# - deployment/docker-compose.prod.yml (ports: "5433:5432")
```

### Environment Variable Issues

#### Problem: DATABASE_URL conflict
If you have multiple apps using `DATABASE_URL`, the certificate app prioritizes individual variables:
```env
# These take priority (for certificate app)
DB_HOST=localhost
DB_PORT=5433
DB_NAME=certificate_db
DB_USER=your_db_user
DB_PASSWORD=your_password

# This is ignored if above variables are set
DATABASE_URL=...  # Used by your other apps
```

#### Problem: Wrong environment file used
The production build must use `environment.prod.ts`. Check `frontend/angular.json`:
```json
"production": {
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.prod.ts"
    }
  ],
  ...
}
```

---

## Useful Commands

### Service Management

```bash
# PM2 Status
pm2 status                    # Show all processes
pm2 logs certificate-api      # View API logs
pm2 restart certificate-api   # Restart API
pm2 stop certificate-api      # Stop API
pm2 delete certificate-api    # Remove process

# Docker/Database
docker ps                     # Show running containers
docker logs certificate_db_prod  # View database logs
docker-compose -f deployment/docker-compose.prod.yml restart  # Restart DB
docker exec -it certificate_db_prod psql -U your_db_user -d certificate_db  # Connect to DB

# Nginx
sudo systemctl status nginx   # Check status
sudo systemctl reload nginx   # Reload config
sudo nginx -t                 # Test configuration
sudo tail -f /var/log/nginx/certificate-app-access.log  # Access logs
sudo tail -f /var/log/nginx/certificate-app-error.log   # Error logs
```

### Health Checks

```bash
# API health
curl http://localhost:3001/api/health

# Frontend health
curl http://localhost:8080

# Full stack test
curl http://localhost:8080/api/health
```

### Monitoring

```bash
# System resources
htop                          # Interactive process viewer
df -h                         # Disk usage
free -h                       # Memory usage

# PM2 monitoring
pm2 monit                     # Real-time monitoring

# Log files
sudo tail -f /var/log/pm2/certificate-api-out.log
sudo tail -f /var/log/pm2/certificate-api-error.log
```

---

## Security Notes

1. **Never commit `.env`** - Already in `.gitignore`
2. **Use strong passwords** - 16+ characters, random
3. **Random JWT secret** - 32+ characters: `openssl rand -base64 32`
4. **Keep firewall enabled** - `sudo ufw status`
5. **Regular updates** - `sudo apt update && sudo apt upgrade`
6. **Monitor logs** - Check for suspicious activity
7. **Database not exposed** - Port 5433 only accessible internally
8. **Restrict .env permissions** - `chmod 600 .env`

---

## Cleanup / Uninstall

To completely remove the certificate app:

```bash
# Stop services
pm2 delete certificate-api
docker-compose -f /var/www/certificate-app/deployment/docker-compose.prod.yml down -v

# Remove Nginx config
sudo rm /etc/nginx/sites-enabled/certificate-app
sudo rm /etc/nginx/sites-available/certificate-app
sudo systemctl reload nginx

# Remove files
sudo rm -rf /var/www/certificate-app
sudo rm -rf /var/lib/postgresql/certificate-app

# Close firewall port
sudo ufw delete allow 8080/tcp
```

**Note:** This does NOT uninstall Docker, Node.js, PM2, or Nginx as they may be used by other applications.

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review logs: `pm2 logs certificate-api`
3. Verify services: `pm2 status && docker ps && sudo systemctl status nginx`
4. Test each component individually using the health check commands

---

**Deployment Date:** $(date)
**Node.js Version Required:** 18+
**PostgreSQL Version:** 15
**Tested on:** Ubuntu 20.04, Ubuntu 22.04
