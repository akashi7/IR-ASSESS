# Deployment on VPS with Existing PM2 and Nginx

Since your VPS **already has PM2 and Nginx installed**, here's the simplified deployment process that won't interfere with your existing setup.

## ✅ What Won't Be Affected

- ✅ Your existing Nginx configs (in `/etc/nginx/sites-available/`)
- ✅ Your existing PM2 processes
- ✅ Your existing domain-based app on port 80
- ✅ Any other services running

## 🎯 Simplified Deployment

### Step 1: Minimal VPS Setup (One-Time)

Use the **minimal setup script** that only installs Docker and Node.js (skips PM2/Nginx):

```bash
# SSH to VPS
ssh root@144.91.122.113

# Download minimal setup script
wget https://raw.githubusercontent.com/akashi7/IR-ASSESS/main/deployment/setup-vps-minimal.sh

# Run it
chmod +x setup-vps-minimal.sh
sudo ./setup-vps-minimal.sh

# Log out and back in (for Docker permissions)
exit
ssh root@144.91.122.113
```

**This installs ONLY:**
- Docker (for PostgreSQL)
- Docker Compose
- Node.js 18 (if not present or old version)
- Git (if not present)
- Opens port 8080 in firewall

**It SKIPS:**
- PM2 (you already have it)
- Nginx (you already have it)

### Step 2: Deploy Application

```bash
# Clone repo
cd /var/www/certificate-app
git clone https://github.com/akashi7/IR-ASSESS.git .

# Configure environment
cp .env.example .env
nano .env
# Set your database credentials and JWT secret

# Deploy
bash deployment/deploy-from-github.sh
```

## 🔧 How It Works with Your Existing Setup

### Your Existing App
```
Port 80 (Nginx) → Your Domain → Your Existing App
Port 3000 (PM2) → Your Existing API
```

### Certificate App (New)
```
Port 8080 (Nginx) → 144.91.122.113:8080 → Certificate App
Port 3001 (PM2)   → Certificate API (new PM2 process)
Port 5433 (Docker) → PostgreSQL (isolated)
```

### Nginx Configuration

The deployment adds a **new, separate** Nginx config:
- **Your existing configs:** `/etc/nginx/sites-available/your-existing-app`
- **New certificate app:** `/etc/nginx/sites-available/certificate-app`

Both run independently:

```nginx
# Your existing app (unchanged)
server {
    listen 80;
    server_name your-domain.com;
    # ... your existing config ...
}

# Certificate app (new - port 8080)
server {
    listen 8080;
    server_name 144.91.122.113;
    # ... certificate app config ...
}
```

### PM2 Processes

You'll have separate PM2 processes:

```bash
pm2 list
# Output:
# ┌─────┬────────────────────┬─────────┬─────────┐
# │ id  │ name               │ status  │ port    │
# ├─────┼────────────────────┼─────────┼─────────┤
# │ 0   │ your-existing-app  │ online  │ 3000    │
# │ 1   │ certificate-api    │ online  │ 3001    │
# └─────┴────────────────────┴─────────┴─────────┘
```

## 📋 Manual Nginx Configuration (If Needed)

If you prefer to manually add the Nginx config to your existing setup:

```bash
# Copy the nginx config
sudo cp /var/www/certificate-app/deployment/nginx-vps.conf /etc/nginx/sites-available/certificate-app

# Create symlink
sudo ln -s /etc/nginx/sites-available/certificate-app /etc/nginx/sites-enabled/

# Test config (won't break existing configs)
sudo nginx -t

# If OK, reload
sudo systemctl reload nginx
```

## 🔍 Verify No Conflicts

### Check Nginx Configs
```bash
# List all nginx configs
ls -la /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t
```

### Check PM2 Processes
```bash
# List all PM2 processes
pm2 list

# Should show both your existing app and certificate-api
```

### Check Ports
```bash
# Check what's listening
sudo netstat -tlnp | grep -E ':(80|3000|3001|8080|5433)'

# Should show:
# :80   → nginx (your existing app)
# :3000 → node (your existing PM2 app, if any)
# :3001 → node (certificate-api)
# :8080 → nginx (certificate app)
# :5433 → docker-proxy (PostgreSQL)
```

## 🚀 Access Points

- **Your existing app:** `http://your-domain.com`
- **Certificate app:** `http://144.91.122.113:8080`

## 🔄 Updating Certificate App

```bash
cd /var/www/certificate-app
git pull
bash deployment/deploy-from-github.sh
```

Your existing app is **never touched** during updates.

## 🛠️ Managing Both Apps

### View All PM2 Processes
```bash
pm2 list
pm2 status
```

### Restart Specific App
```bash
# Your existing app
pm2 restart your-existing-app

# Certificate app
pm2 restart certificate-api
```

### View Logs
```bash
# Your existing app
pm2 logs your-existing-app

# Certificate app
pm2 logs certificate-api
```

### Nginx Management
```bash
# Test all configs
sudo nginx -t

# Reload (affects all configs)
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# View all logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/certificate-app-access.log
```

## 🐛 Troubleshooting

### Nginx Won't Reload
```bash
# Test config first
sudo nginx -t

# Check which config has errors
sudo nginx -t 2>&1 | grep "failed"

# If certificate-app config has issues, disable it temporarily
sudo rm /etc/nginx/sites-enabled/certificate-app
sudo systemctl reload nginx

# Fix the issue, then re-enable
sudo ln -s /etc/nginx/sites-available/certificate-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Port Conflicts
```bash
# Check if port 8080 is already used
sudo lsof -i :8080

# If something else is using it, change port in:
# - deployment/nginx-vps.conf (listen 8081;)
# Then reload nginx
```

### PM2 Process Name Conflict
```bash
# If "certificate-api" name conflicts, change it in:
# - deployment/ecosystem.config.js (name: 'certificate-api-v2')
# Then restart
pm2 delete certificate-api
pm2 start ecosystem.config.js
```

## 📊 Resource Usage

The certificate app adds:
- **Memory:** ~200-300MB (Node.js API + PostgreSQL)
- **Disk:** ~500MB (code + node_modules + DB data)
- **CPU:** Minimal when idle

Your existing app's resources are **not affected**.

## 🗑️ Removing Certificate App (If Needed)

```bash
# Stop PM2 process
pm2 delete certificate-api

# Stop database
cd /var/www/certificate-app
docker-compose -f deployment/docker-compose.prod.yml down -v

# Remove Nginx config
sudo rm /etc/nginx/sites-enabled/certificate-app
sudo rm /etc/nginx/sites-available/certificate-app
sudo systemctl reload nginx

# Remove files
sudo rm -rf /var/www/certificate-app

# Close firewall port
sudo ufw delete allow 8080/tcp
```

Your existing app remains completely untouched!

## ✅ Quick Checklist

Before deployment:
- [ ] PM2 is installed: `pm2 --version`
- [ ] Nginx is installed: `nginx -v`
- [ ] Port 8080 is available: `sudo lsof -i :8080`
- [ ] Port 3001 is available: `sudo lsof -i :3001`
- [ ] Port 5433 is available: `sudo lsof -i :5433`

After deployment:
- [ ] Certificate app accessible: `http://144.91.122.113:8080`
- [ ] Your existing app still works: `http://your-domain.com`
- [ ] Both PM2 processes running: `pm2 list`
- [ ] Nginx config valid: `sudo nginx -t`

---

**Summary:** The certificate app runs completely separately from your existing setup. Different ports, different configs, different PM2 process. No interference!
