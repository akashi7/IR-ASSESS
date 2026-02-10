# Deployment Directory

This directory contains all the scripts and configurations needed to deploy the Certificate Management App to your VPS.

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `setup-vps.sh` | One-time VPS setup - installs Docker, Node.js, PM2, Nginx, etc. |
| `deploy-from-github.sh` | Main deployment script - builds and deploys from GitHub |
| `nginx-vps.conf` | Nginx configuration for the VPS (port 8080) |
| `ecosystem.config.js` | PM2 process manager configuration |
| `docker-compose.prod.yml` | Production Docker Compose for PostgreSQL |
| `GITHUB_DEPLOYMENT.md` | Complete GitHub deployment guide |
| `DEPLOYMENT_GUIDE.md` | Full deployment documentation (rsync method) |
| `QUICK_START.md` | Fast 3-step deployment guide |
| `QUICK_REFERENCE.md` | Command reference card |

## 🚀 Quick Start

### Method 1: Automated GitHub Deployment (Recommended)

1. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Setup VPS (once):**
   ```bash
   ssh root@144.91.122.113
   wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/deployment/setup-vps.sh
   chmod +x setup-vps.sh
   sudo ./setup-vps.sh
   ```

3. **Deploy:**
   ```bash
   cd /var/www/certificate-app
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
   cp .env.example .env && nano .env
   bash deployment/deploy-from-github.sh
   ```

**Read:** [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md)

### Method 2: Manual rsync Deployment

1. **Build and upload from local:**
   ```bash
   cd /home/akashi/Documents/applications/irembo/deployment
   ./deploy.sh local
   ```

2. **Deploy on VPS:**
   ```bash
   ssh root@144.91.122.113
   cd /var/www/certificate-app
   bash deployment/deploy.sh vps
   ```

**Read:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 🔧 What Gets Installed

### System Requirements
- Ubuntu 20.04+ (or Debian-based Linux)
- 1GB+ RAM (2GB recommended)
- 20GB+ disk space
- Root or sudo access

### Installed by setup-vps.sh
- ✅ **Docker** (latest) - Runs PostgreSQL
- ✅ **Docker Compose** (latest) - Container orchestration
- ✅ **Node.js 18** - JavaScript runtime
- ✅ **PM2** - Process manager for Node.js
- ✅ **Nginx** - Web server and reverse proxy
- ✅ **Git** - Version control

### PostgreSQL
**You do NOT install PostgreSQL manually** - it runs inside a Docker container automatically!

## 📊 Architecture

```
Internet
   ↓
144.91.122.113:8080 (Nginx)
   ├─→ /          → Frontend (Angular static files)
   └─→ /api/*     → Proxy to API (localhost:3001)
                        ↓
                   PM2 (Node.js/Express)
                        ↓
                   PostgreSQL (Docker:5433)
```

## 🔐 Port Allocation

| Port | Service | Access | Notes |
|------|---------|--------|-------|
| 8080 | Frontend (Nginx) | Public | Your certificate app |
| 3001 | API (PM2/Node.js) | Internal | Proxied through Nginx |
| 5433 | Database (Docker/PostgreSQL) | Internal | Not exposed externally |
| 80 | Your existing app | Public | Unchanged |
| 3000 | Your existing API (if any) | - | Unchanged |

**No port conflicts!** All services use different ports from your existing app.

## 📝 Configuration Files

### nginx-vps.conf
- Listens on port 8080
- Serves Angular frontend from `/var/www/certificate-app/frontend`
- Proxies `/api/*` to `localhost:3001`
- Includes security headers and gzip compression

### ecosystem.config.js
- PM2 process named `certificate-api`
- Runs API on port 3001
- Auto-restart on failure
- Logs to `/var/log/pm2/`

### docker-compose.prod.yml
- PostgreSQL 15 container
- Named `certificate_db_prod`
- Port 5433:5432
- Data persisted to `/var/lib/postgresql/certificate-app`
- Health checks enabled

## 🔄 Update Workflow

```bash
# 1. Make changes locally
# 2. Push to GitHub
git add .
git commit -m "Your changes"
git push

# 3. On VPS
ssh root@144.91.122.113
cd /var/www/certificate-app
git pull
bash deployment/deploy-from-github.sh
```

## 🐛 Troubleshooting

### Setup Issues
```bash
# Check if services are installed
docker --version
node --version
pm2 --version
nginx -v

# If missing, re-run setup
sudo ./setup-vps.sh
```

### Deployment Issues
```bash
# Check logs
pm2 logs certificate-api
docker logs certificate_db_prod
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart certificate-api
docker restart certificate_db_prod
sudo systemctl reload nginx
```

### Port Conflicts
```bash
# Find what's using a port
sudo lsof -i :8080
sudo lsof -i :3001
sudo lsof -i :5433

# Change ports in config files if needed
```

## 📚 Documentation

- **Quick Start:** [QUICK_START.md](QUICK_START.md) - Fast 3-step guide
- **GitHub Method:** [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md) - Complete GitHub guide
- **Manual Method:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete rsync guide
- **Quick Reference:** [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command cheat sheet

## ✅ Post-Deployment Checklist

- [ ] Application accessible at http://144.91.122.113:8080
- [ ] API health check responds: `curl http://144.91.122.113:8080/api/health`
- [ ] PM2 shows app running: `pm2 status`
- [ ] Database container running: `docker ps | grep certificate_db_prod`
- [ ] Nginx running: `sudo systemctl status nginx`
- [ ] Firewall configured: `sudo ufw status`
- [ ] Strong passwords in `.env`
- [ ] `.env` not committed to git

## 🔐 Security Notes

1. **Never commit `.env`** - Already in `.gitignore`
2. **Use strong passwords** - 16+ characters
3. **Random JWT secret** - 32+ characters
4. **Keep firewall enabled** - `sudo ufw status`
5. **Regular updates** - `sudo apt update && sudo apt upgrade`
6. **Monitor logs** - Check for suspicious activity

## 🆘 Getting Help

1. Check the appropriate guide based on your deployment method
2. Review logs: `pm2 logs certificate-api`
3. Verify services: `pm2 status && docker ps && sudo systemctl status nginx`
4. Test each component individually

## 🗑️ Cleanup

To remove everything:

```bash
pm2 delete certificate-api
docker-compose -f /var/www/certificate-app/deployment/docker-compose.prod.yml down -v
sudo rm /etc/nginx/sites-enabled/certificate-app
sudo rm /etc/nginx/sites-available/certificate-app
sudo systemctl reload nginx
sudo rm -rf /var/www/certificate-app
```

---

**Questions?** Read [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md) for the most comprehensive guide.
