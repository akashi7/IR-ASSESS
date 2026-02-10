# Deployment Guide for Certificate Management App on VPS

This guide will help you deploy the Certificate Management app on your VPS (144.91.122.113) alongside your existing application without any conflicts.

## Architecture Overview

- **Frontend**: Nginx serving Angular app on port 8080
- **API**: Node.js/Express managed by PM2 on port 3001
- **Database**: PostgreSQL in Docker on port 5433
- **Access**: http://144.91.122.113:8080

## Prerequisites

- Ubuntu VPS with sudo access
- Node.js 18+ installed
- Docker and Docker Compose installed
- PM2 installed globally
- Nginx installed

## Step-by-Step Deployment

### 1. Prepare the VPS Directory Structure

```bash
# SSH into your VPS
ssh root@144.91.122.113

# Create application directory
sudo mkdir -p /var/www/certificate-app
sudo mkdir -p /var/www/certificate-app/api
sudo mkdir -p /var/www/certificate-app/frontend

# Create log directories
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/www/certificate-app
```

### 2. Upload Your Code to VPS

From your local machine:

```bash
# Navigate to your project
cd /home/akashi/Documents/applications/irembo

# Upload API code
rsync -avz --exclude 'node_modules' ./api/ root@144.91.122.113:/var/www/certificate-app/api/

# Build frontend locally first
cd frontend
npm install
npm run build

# Upload built frontend
rsync -avz ./dist/certificate-management-frontend/ root@144.91.122.113:/var/www/certificate-app/frontend/

# Upload deployment files
scp deployment/ecosystem.config.js root@144.91.122.113:/var/www/certificate-app/
scp deployment/nginx-vps.conf root@144.91.122.113:/tmp/
scp deployment/docker-compose.prod.yml root@144.91.122.113:/var/www/certificate-app/
scp .env.example root@144.91.122.113:/var/www/certificate-app/.env
```

### 3. Set Up Environment Variables

On the VPS:

```bash
cd /var/www/certificate-app

# Edit the .env file with your actual values
nano .env
```

Add your configuration:

```env
POSTGRES_USER=cert_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=certificate_db
JWT_SECRET=your_jwt_secret_here_make_it_long_and_random
```

### 4. Start PostgreSQL Database

```bash
cd /var/www/certificate-app

# Start the database container
docker-compose -f docker-compose.prod.yml up -d

# Verify it's running
docker ps | grep certificate_db_prod

# Check logs
docker logs certificate_db_prod
```

### 5. Set Up the API with PM2

```bash
cd /var/www/certificate-app/api

# Install dependencies
npm install --production

# Update ecosystem.config.js with your actual env values
nano /var/www/certificate-app/ecosystem.config.js
# Update DB credentials and JWT_SECRET

# Start the API with PM2
cd /var/www/certificate-app
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot (if not already done)
pm2 startup systemd
# Run the command it outputs

# Check status
pm2 status
pm2 logs certificate-api
```

### 6. Configure Nginx

```bash
# Copy nginx config to sites-available
sudo cp /tmp/nginx-vps.conf /etc/nginx/sites-available/certificate-app

# Create symlink to sites-enabled
sudo ln -s /etc/nginx/sites-available/certificate-app /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx
```

### 7. Open Firewall Port

```bash
# Allow port 8080 through firewall
sudo ufw allow 8080/tcp

# Check firewall status
sudo ufw status
```

### 8. Verify Deployment

```bash
# Check if API is running
curl http://localhost:3001/api/health

# Check if frontend is accessible
curl http://localhost:8080

# Check from outside
# In your browser: http://144.91.122.113:8080
```

## Port Mapping Summary

| Service | Port | Purpose |
|---------|------|---------|
| Nginx (this app) | 8080 | Frontend access |
| Node.js API | 3001 | Backend API |
| PostgreSQL | 5433 | Database |

## Management Commands

### PM2 Commands
```bash
# View app status
pm2 status

# View logs
pm2 logs certificate-api

# Restart app
pm2 restart certificate-api

# Stop app
pm2 stop certificate-api

# Delete app from PM2
pm2 delete certificate-api
```

### Docker Commands
```bash
cd /var/www/certificate-app

# View database logs
docker logs certificate_db_prod

# Stop database
docker-compose -f docker-compose.prod.yml down

# Start database
docker-compose -f docker-compose.prod.yml up -d

# Backup database
docker exec certificate_db_prod pg_dump -U cert_user certificate_db > backup.sql
```

### Nginx Commands
```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/certificate-app-access.log
sudo tail -f /var/log/nginx/certificate-app-error.log
```

## Updating the Application

### Update Frontend
```bash
# On local machine
cd /home/akashi/Documents/applications/irembo/frontend
npm run build
rsync -avz ./dist/certificate-management-frontend/ root@144.91.122.113:/var/www/certificate-app/frontend/

# No restart needed - just refresh browser
```

### Update API
```bash
# On local machine
cd /home/akashi/Documents/applications/irembo
rsync -avz --exclude 'node_modules' ./api/ root@144.91.122.113:/var/www/certificate-app/api/

# On VPS
cd /var/www/certificate-app/api
npm install --production
pm2 restart certificate-api
```

## Troubleshooting

### API Not Starting
```bash
# Check PM2 logs
pm2 logs certificate-api --lines 100

# Check if port 3001 is available
sudo lsof -i :3001

# Manually test the API
cd /var/www/certificate-app/api
node src/server.js
```

### Database Connection Issues
```bash
# Check if database container is running
docker ps | grep certificate_db_prod

# Check database logs
docker logs certificate_db_prod

# Test database connection
docker exec -it certificate_db_prod psql -U cert_user -d certificate_db
```

### Nginx Issues
```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/certificate-app-error.log

# Test nginx config
sudo nginx -t

# Check if port 8080 is listening
sudo netstat -tlnp | grep :8080
```

### Port Conflicts
```bash
# Check what's using a port
sudo lsof -i :8080
sudo lsof -i :3001
sudo lsof -i :5433

# If needed, change ports in:
# - /etc/nginx/sites-available/certificate-app (port 8080)
# - /var/www/certificate-app/ecosystem.config.js (port 3001)
# - /var/www/certificate-app/docker-compose.prod.yml (port 5433)
```

## Security Recommendations

1. **Firewall**: Only open necessary ports (8080, 5433 if external access needed)
2. **Database**: Keep PostgreSQL port (5433) closed to external traffic
3. **Environment Variables**: Never commit `.env` file with real credentials
4. **Updates**: Regularly update Node.js, npm packages, and system packages
5. **SSL** (Optional): If you get a domain later, add SSL with Let's Encrypt

## Monitoring

```bash
# Monitor system resources
htop

# Monitor disk usage
df -h

# Monitor specific process
pm2 monit

# Check Docker stats
docker stats certificate_db_prod
```

## Cleanup (if needed)

```bash
# Stop and remove everything
pm2 delete certificate-api
docker-compose -f docker-compose.prod.yml down -v
sudo rm /etc/nginx/sites-enabled/certificate-app
sudo systemctl reload nginx
sudo rm -rf /var/www/certificate-app
```

## Access Your Application

Once deployed, access your application at:
**http://144.91.122.113:8080**

The API endpoints will be available at:
**http://144.91.122.113:8080/api/***
