# GitHub-Based Deployment Guide

This guide shows you how to deploy the Certificate Management App to your VPS using GitHub.

## 📋 Prerequisites

- Ubuntu VPS at 144.91.122.113
- SSH access to the VPS
- GitHub account

## 🚀 Quick Deployment (3 Steps)

### Step 1: Push to GitHub

```bash
# On your local machine
cd /home/akashi/Documents/applications/irembo

# Initialize git if needed
git init
git add .
git commit -m "Initial commit"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 2: Setup VPS (One-Time)

```bash
# SSH into your VPS
ssh root@144.91.122.113

# Download and run setup script
wget https://raw.githubusercontent.com/akashi7/IR-ASSESS/main/deployment/setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh

# Log out and back in (for Docker permissions)
exit
ssh root@144.91.122.113
```

**What the setup script installs:**

- ✅ Docker & Docker Compose
- ✅ Node.js 18 LTS
- ✅ PM2 Process Manager
- ✅ Nginx
- ✅ Git
- ✅ Firewall configuration
- ✅ Directory structure

**Note:** You do **NOT** need to install PostgreSQL separately - it runs in Docker!

### Step 3: Clone and Deploy

```bash
# Still on VPS
cd /var/www/certificate-app

# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Configure environment
cp .env.example .env
nano .env
# Edit with your actual credentials:
# - POSTGRES_USER=cert_user
# - POSTGRES_PASSWORD=your_secure_password
# - POSTGRES_DB=certificate_db
# - JWT_SECRET=your_long_random_secret

# Run deployment
bash deployment/deploy-from-github.sh
```

### Access Your App

🌐 **http://144.91.122.113:8080**

---

## 🔄 Updating Your App

When you make changes and want to redeploy:

```bash
# On local machine - push changes
git add .
git commit -m "Your changes"
git push

# On VPS - pull and redeploy
cd /var/www/certificate-app
git pull
bash deployment/deploy-from-github.sh
```

---

## 📦 What Gets Installed on VPS

### System Packages

- Docker Engine (latest)
- Docker Compose (latest)
- Node.js 18 LTS
- PM2 (latest)
- Nginx (latest)
- Git
- Build tools

### Services Running

| Service     | Type             | Port | Purpose          |
| ----------- | ---------------- | ---- | ---------------- |
| PostgreSQL  | Docker Container | 5433 | Database         |
| Node.js API | PM2 Process      | 3001 | Backend API      |
| Nginx       | System Service   | 8080 | Frontend + Proxy |

### No Conflicts

All ports are different from your existing app:

- Your existing app: ports 80, 3000, etc.
- Certificate app: ports 8080, 3001, 5433

---

## 🛠️ Detailed Setup Script

The `setup-vps.sh` script does the following:

1. **Updates system packages**
2. **Installs Docker**
   - Adds official Docker repository
   - Installs Docker Engine & Docker Compose
   - Adds user to docker group
   - Enables Docker service

3. **Installs Node.js 18**
   - Adds NodeSource repository
   - Installs Node.js LTS
   - Includes npm

4. **Installs PM2**
   - Installs globally via npm
   - Configures startup script

5. **Installs Nginx**
   - Installs from Ubuntu repos
   - Enables and starts service

6. **Configures Firewall (UFW)**
   - Allows SSH (22)
   - Allows existing app (80, 443)
   - Allows new app (8080)

7. **Creates directories**
   - `/var/www/certificate-app` (app root)
   - `/var/log/pm2` (PM2 logs)
   - `/var/lib/postgresql/certificate-app` (DB data)

8. **System optimizations**
   - Increases file limits
   - Creates swap if needed (on low-memory VPS)

---

## 🔧 Manual Installation (If Script Fails)

If the automated script doesn't work, here's how to install manually:

### Install Docker

```bash
# Add Docker's GPG key
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Start Docker
sudo systemctl enable docker
sudo systemctl start docker
```

### Install Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install PM2

```bash
sudo npm install -g pm2
pm2 startup systemd
# Run the command it outputs
```

### Install Nginx

```bash
sudo apt-get install nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw enable
```

---

## 📝 Environment Variables

Create `.env` file with these variables:

```env
# Database Configuration
POSTGRES_USER=cert_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=certificate_db

# JWT Secret (make it long and random)
JWT_SECRET=your_very_long_random_jwt_secret_at_least_32_characters

# Optional: API Configuration
NODE_ENV=production
PORT=3001
```

**Security Tips:**

- Use strong passwords (16+ characters)
- Use random JWT secret (32+ characters)
- Never commit `.env` to git
- Keep `.env` file permissions restricted: `chmod 600 .env`

---

## 🐛 Troubleshooting

### Setup Script Issues

**Problem: "Docker not found" after setup**

```bash
# Log out and back in
exit
ssh root@144.91.122.113

# Or reload groups
newgrp docker
```

**Problem: "Permission denied" for Docker**

```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Problem: Node.js version wrong**

```bash
# Remove old Node.js
sudo apt-get purge nodejs npm

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs
```

### Deployment Issues

**Problem: Port already in use**

```bash
# Check what's using the port
sudo lsof -i :8080
sudo lsof -i :3001

# Kill process if needed
sudo kill -9 <PID>
```

**Problem: Git clone fails**

```bash
# If private repo, setup SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Add to GitHub Settings > SSH Keys

# Or use HTTPS with token
git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO.git
```

**Problem: npm install fails**

```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

**Problem: Frontend build fails**

```bash
# Check Node.js version
node --version  # Should be 18+

# Increase Node.js memory
export NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

### Database Issues

**Problem: Database won't start**

```bash
# Check Docker logs
docker logs certificate_db_prod

# Remove and recreate
docker-compose -f deployment/docker-compose.prod.yml down -v
docker-compose -f deployment/docker-compose.prod.yml up -d
```

**Problem: Can't connect to database**

```bash
# Check if running
docker ps | grep certificate_db_prod

# Test connection
docker exec -it certificate_db_prod psql -U cert_user -d certificate_db
```

### API Issues

**Problem: API won't start**

```bash
# Check logs
pm2 logs certificate-api --lines 50

# Check if port is available
sudo lsof -i :3001

# Restart
pm2 restart certificate-api
```

### Nginx Issues

**Problem: Nginx config invalid**

```bash
# Test config
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

**Problem: 502 Bad Gateway**

```bash
# API not running - check PM2
pm2 status
pm2 logs certificate-api

# Start API if stopped
pm2 restart certificate-api
```

---

## 🔐 Security Checklist

- [ ] Strong database password
- [ ] Random JWT secret (32+ characters)
- [ ] Firewall enabled and configured
- [ ] SSH key authentication (disable password auth)
- [ ] `.env` file not in git
- [ ] Regular system updates: `sudo apt update && sudo apt upgrade`
- [ ] PM2 logs monitored for errors
- [ ] Database only accessible locally (not on port 5433 externally)

---

## 📊 Monitoring

### Check Service Status

```bash
# All services
pm2 status
docker ps
sudo systemctl status nginx

# Detailed monitoring
pm2 monit

# Resource usage
htop
df -h
free -h
```

### View Logs

```bash
# API logs
pm2 logs certificate-api

# Database logs
docker logs certificate_db_prod -f

# Nginx access logs
sudo tail -f /var/log/nginx/certificate-app-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/certificate-app-error.log
```

---

## 🗑️ Uninstall

To completely remove the app:

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

# Close firewall
sudo ufw delete allow 8080/tcp
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)

---

## ✅ Quick Reference

### First Time Setup

```bash
ssh root@144.91.122.113
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/deployment/setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh
exit && ssh root@144.91.122.113
cd /var/www/certificate-app
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
cp .env.example .env && nano .env
bash deployment/deploy-from-github.sh
```

### Update App

```bash
cd /var/www/certificate-app
git pull
bash deployment/deploy-from-github.sh
```

### View Status

```bash
pm2 status
docker ps
sudo systemctl status nginx
```

### View Logs

```bash
pm2 logs certificate-api
docker logs certificate_db_prod
sudo tail -f /var/log/nginx/certificate-app-access.log
```

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.
