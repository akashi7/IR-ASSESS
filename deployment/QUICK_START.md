# Quick Start - Deploy to VPS

## TL;DR - Deploy in 3 Commands

### Step 1: Deploy from your local machine
```bash
cd /home/akashi/Documents/applications/irembo/deployment
./deploy.sh local
```

### Step 2: SSH to your VPS
```bash
ssh root@144.91.122.113
```

### Step 3: Run deployment on VPS
```bash
cd /var/www/certificate-app
bash deployment/deploy.sh vps
```

### Access your app:
**http://144.91.122.113:8080**

---

## What This Does

### Ports Used (No Conflicts!)
- ✅ **Port 8080** - Your certificate app frontend (nginx)
- ✅ **Port 3001** - Your certificate app API (PM2)
- ✅ **Port 5433** - Your certificate app database (Docker)

Your existing app on ports 80, 3000, etc. remains untouched!

### Architecture
```
Internet → 144.91.122.113:8080 → Nginx → Frontend (Angular)
                    ↓
                   /api → Proxy → localhost:3001 (PM2 Node.js API)
                                         ↓
                                   PostgreSQL (Docker:5433)
```

---

## Manual Deployment (If Script Fails)

### On Local Machine:
```bash
cd /home/akashi/Documents/applications/irembo/frontend
npm install && npm run build

# Upload
rsync -avz --exclude 'node_modules' ../api/ root@144.91.122.113:/var/www/certificate-app/api/
rsync -avz ./dist/certificate-management-frontend/ root@144.91.122.113:/var/www/certificate-app/frontend/
scp ../deployment/* root@144.91.122.113:/var/www/certificate-app/deployment/
```

### On VPS:
```bash
# Database
cd /var/www/certificate-app
docker-compose -f docker-compose.prod.yml up -d

# API
cd api && npm install --production && cd ..
pm2 start ecosystem.config.js
pm2 save

# Nginx
sudo cp deployment/nginx-vps.conf /etc/nginx/sites-available/certificate-app
sudo ln -s /etc/nginx/sites-available/certificate-app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Firewall
sudo ufw allow 8080/tcp
```

---

## Verify Deployment

```bash
# On VPS
curl http://localhost:8080  # Should return HTML
curl http://localhost:3001/api/health  # Should return API response
docker ps | grep certificate  # Should show database
pm2 status  # Should show certificate-api running
```

---

## Common Issues

### Port 8080 already in use?
```bash
# Find what's using it
sudo lsof -i :8080

# Change to different port in:
# - deployment/nginx-vps.conf (listen 8081;)
# - Then: sudo systemctl reload nginx
```

### API won't start?
```bash
pm2 logs certificate-api
# Check database credentials in ecosystem.config.js
```

### Can't access from browser?
```bash
# Check firewall
sudo ufw status
sudo ufw allow 8080/tcp

# Check nginx
sudo systemctl status nginx
```

---

## Update App Later

### Update Frontend:
```bash
# Local
cd frontend && npm run build
rsync -avz ./dist/certificate-management-frontend/ root@144.91.122.113:/var/www/certificate-app/frontend/
# No restart needed!
```

### Update API:
```bash
# Local
rsync -avz --exclude 'node_modules' ./api/ root@144.91.122.113:/var/www/certificate-app/api/

# VPS
ssh root@144.91.122.113
cd /var/www/certificate-app/api && npm install --production
pm2 restart certificate-api
```

---

## Helpful Commands

```bash
# View logs
pm2 logs certificate-api
sudo tail -f /var/log/nginx/certificate-app-access.log
docker logs certificate_db_prod

# Restart services
pm2 restart certificate-api
sudo systemctl reload nginx
docker restart certificate_db_prod

# Stop everything
pm2 stop certificate-api
docker-compose -f docker-compose.prod.yml down
```

---

## Need Help?
Read the full guide: `DEPLOYMENT_GUIDE.md`
