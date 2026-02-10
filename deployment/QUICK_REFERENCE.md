# 🚀 Quick Reference Card

## First Time Deployment (GitHub Method)

### 1️⃣ Push to GitHub (Local Machine)
```bash
cd /home/akashi/Documents/applications/irembo
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2️⃣ Setup VPS (One-Time Only)
```bash
ssh root@144.91.122.113

# Download setup script
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/deployment/setup-vps.sh

# Run it
chmod +x setup-vps.sh
sudo ./setup-vps.sh

# Log out and back in
exit
ssh root@144.91.122.113
```

### 3️⃣ Deploy Application
```bash
cd /var/www/certificate-app
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Configure
cp .env.example .env
nano .env  # Add your credentials

# Deploy
bash deployment/deploy-from-github.sh
```

### ✅ Access: http://144.91.122.113:8080

---

## Update Application

```bash
# Local: Push changes
git add .
git commit -m "Your changes"
git push

# VPS: Pull and deploy
ssh root@144.91.122.113
cd /var/www/certificate-app
git pull
bash deployment/deploy-from-github.sh
```

---

## Essential Commands

### Service Management
```bash
pm2 status                    # Check API status
pm2 restart certificate-api   # Restart API
pm2 logs certificate-api      # View API logs

docker ps                     # Check database
docker logs certificate_db_prod  # Database logs

sudo systemctl status nginx   # Check nginx
sudo systemctl reload nginx   # Reload nginx config
```

### View Logs
```bash
# API logs (live)
pm2 logs certificate-api

# Nginx access logs
sudo tail -f /var/log/nginx/certificate-app-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/certificate-app-error.log

# Database logs
docker logs certificate_db_prod -f
```

### Troubleshooting
```bash
# Check what's using a port
sudo lsof -i :8080
sudo lsof -i :3001
sudo lsof -i :5433

# Test API directly
curl http://localhost:3001/api/health

# Test frontend
curl http://localhost:8080

# Check firewall
sudo ufw status

# System resources
htop
df -h
free -h
```

---

## Port Reference

| Service | Port | Access |
|---------|------|--------|
| Frontend | 8080 | Public |
| API | 3001 | Internal (proxied) |
| Database | 5433 | Internal only |

Your existing app (ports 80, 3000, etc.) is NOT affected!

---

## Environment Variables (.env)

```env
POSTGRES_USER=cert_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=certificate_db
JWT_SECRET=your_long_random_secret_min_32_chars
```

---

## Database Access

```bash
# Connect to database
docker exec -it certificate_db_prod psql -U cert_user -d certificate_db

# Backup database
docker exec certificate_db_prod pg_dump -U cert_user certificate_db > backup.sql

# Restore database
cat backup.sql | docker exec -i certificate_db_prod psql -U cert_user -d certificate_db
```

---

## Common Issues & Fixes

**API won't start?**
```bash
pm2 logs certificate-api  # Check errors
pm2 restart certificate-api
```

**502 Bad Gateway?**
```bash
pm2 status  # Is API running?
pm2 restart certificate-api
```

**Database connection failed?**
```bash
docker ps  # Is DB running?
docker logs certificate_db_prod
docker restart certificate_db_prod
```

**Port already in use?**
```bash
sudo lsof -i :8080  # Find what's using it
sudo kill -9 <PID>  # Kill if needed
```

---

## Stop/Remove Everything

```bash
pm2 delete certificate-api
docker-compose -f /var/www/certificate-app/deployment/docker-compose.prod.yml down -v
sudo rm /etc/nginx/sites-enabled/certificate-app
sudo systemctl reload nginx
sudo rm -rf /var/www/certificate-app
```

---

## Installation Check

After running `setup-vps.sh`, verify:
```bash
docker --version          # Should show Docker 20+
docker-compose --version  # Should show version
node --version           # Should show v18+
npm --version            # Should show version
pm2 --version            # Should show version
nginx -v                 # Should show version
```

---

## Monitoring

```bash
# Process monitoring
pm2 monit

# Resource usage
htop

# Disk usage
df -h

# Memory usage
free -h

# Docker stats
docker stats certificate_db_prod
```

---

## File Locations

```
/var/www/certificate-app/          # Application root
/var/www/certificate-app/api/      # API code
/var/www/certificate-app/frontend/ # Frontend files
/var/log/pm2/                      # PM2 logs
/var/log/nginx/                    # Nginx logs
/etc/nginx/sites-available/        # Nginx configs
/var/lib/postgresql/certificate-app/  # Database data
```

---

## Security Reminders

- ✅ Use strong passwords (16+ characters)
- ✅ Random JWT secret (32+ characters)
- ✅ Never commit `.env` to git
- ✅ Keep firewall enabled
- ✅ Regular updates: `sudo apt update && sudo apt upgrade`
- ✅ Monitor logs for suspicious activity

---

## Getting Help

1. Check logs: `pm2 logs certificate-api`
2. Check status: `pm2 status && docker ps`
3. Read full guide: `GITHUB_DEPLOYMENT.md`
4. Test components individually

---

**Access your app:** http://144.91.122.113:8080
