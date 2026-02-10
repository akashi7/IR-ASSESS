#!/bin/bash

# Deployment script for Certificate Management App (GitHub version)
# Run this on the VPS after cloning from GitHub
#
# Prerequisites: Run setup-vps.sh first
# Usage: bash deployment/deploy-from-github.sh

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}\n"
}

print_info() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Configuration
VPS_IP="144.91.122.113"
APP_DIR="/var/www/certificate-app"
FRONTEND_PORT=8080
API_PORT=3001
DB_PORT=5433

print_header "Certificate Management App Deployment"

# Check if we're in the right directory
if [ ! -f "deployment/deploy-from-github.sh" ]; then
    print_error "Please run this script from the project root directory"
    print_info "Expected: $APP_DIR"
    print_info "Current: $(pwd)"
    exit 1
fi

# Check prerequisites
print_header "Checking Prerequisites"

if ! command -v docker &> /dev/null; then
    print_error "Docker not found. Please run setup-vps.sh first"
    exit 1
fi
print_info "Docker: $(docker --version)"

if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please run setup-vps.sh first"
    exit 1
fi
print_info "Node.js: $(node --version)"

if ! command -v pm2 &> /dev/null; then
    print_error "PM2 not found. Please run setup-vps.sh first"
    exit 1
fi
print_info "PM2: $(pm2 --version)"

if ! command -v nginx &> /dev/null; then
    print_error "Nginx not found. Please run setup-vps.sh first"
    exit 1
fi
print_info "Nginx: $(nginx -v 2>&1)"

# Check for .env file
print_header "Checking Environment Configuration"

if [ ! -f ".env" ]; then
    print_warn ".env file not found"

    if [ -f ".env.example" ]; then
        print_info "Creating .env from .env.example..."
        cp .env.example .env

        print_warn "⚠️  IMPORTANT: Edit .env file with your actual credentials!"
        print_warn "Run: nano .env"
        echo ""
        read -p "Press Enter after you've configured .env, or Ctrl+C to exit and configure it manually..."
    else
        print_error ".env.example not found. Please create .env manually"
        exit 1
    fi
else
    print_info ".env file found"
fi

# Build frontend
print_header "Building Frontend"

cd frontend

if [ ! -f "package.json" ]; then
    print_error "Frontend package.json not found"
    exit 1
fi

print_info "Installing frontend dependencies..."
npm install

print_info "Building Angular app..."
npm run build

# Check if build was successful
if [ ! -d "dist/certificate-management-frontend" ]; then
    print_error "Frontend build failed - dist directory not found"
    exit 1
fi

print_info "Frontend built successfully"

cd ..

# Install API dependencies
print_header "Installing API Dependencies"

cd api

if [ ! -f "package.json" ]; then
    print_error "API package.json not found"
    exit 1
fi

print_info "Installing production dependencies..."
npm install --production

print_info "API dependencies installed"

cd ..

# Set up database
print_header "Setting Up Database"

if [ ! -f "deployment/docker-compose.prod.yml" ]; then
    print_error "docker-compose.prod.yml not found"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if database is already running
if docker ps | grep -q certificate_db_prod; then
    print_warn "Database container already running"
    read -p "Do you want to restart it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Stopping existing database..."
        docker-compose -f deployment/docker-compose.prod.yml down
        print_info "Starting database..."
        docker-compose -f deployment/docker-compose.prod.yml up -d
    else
        print_info "Keeping existing database"
    fi
else
    print_info "Starting database..."
    docker-compose -f deployment/docker-compose.prod.yml up -d
fi

print_info "Waiting for database to be ready..."
sleep 5

# Verify database is running
if docker ps | grep -q certificate_db_prod; then
    print_info "Database is running"
else
    print_error "Database failed to start"
    docker logs certificate_db_prod
    exit 1
fi

# Configure Nginx
print_header "Configuring Nginx"

if [ ! -f "deployment/nginx-vps.conf" ]; then
    print_error "nginx-vps.conf not found"
    exit 1
fi

# Create directory for frontend if it doesn't exist
sudo mkdir -p /var/www/certificate-app/frontend

# Copy built frontend to nginx directory
print_info "Copying frontend files to nginx directory..."
sudo cp -r frontend/dist/certificate-management-frontend/* /var/www/certificate-app/frontend/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/certificate-app/frontend

# Install nginx config
if [ -f /etc/nginx/sites-available/certificate-app ]; then
    print_warn "Nginx config already exists, backing up..."
    sudo cp /etc/nginx/sites-available/certificate-app /etc/nginx/sites-available/certificate-app.backup.$(date +%Y%m%d_%H%M%S)
fi

print_info "Installing Nginx configuration..."
sudo cp deployment/nginx-vps.conf /etc/nginx/sites-available/certificate-app

# Create symlink if it doesn't exist
if [ ! -L /etc/nginx/sites-enabled/certificate-app ]; then
    sudo ln -s /etc/nginx/sites-available/certificate-app /etc/nginx/sites-enabled/
    print_info "Nginx config symlink created"
fi

# Test nginx configuration
print_info "Testing Nginx configuration..."
if sudo nginx -t; then
    print_info "Nginx config is valid"
    sudo systemctl reload nginx
    print_info "Nginx reloaded"
else
    print_error "Nginx configuration has errors"
    exit 1
fi

# Update ecosystem.config.js with environment variables
print_header "Configuring PM2"

if [ ! -f "deployment/ecosystem.config.js" ]; then
    print_error "ecosystem.config.js not found"
    exit 1
fi

# Create a temporary ecosystem config with actual values
print_info "Creating PM2 configuration with environment variables..."
cat > /tmp/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'certificate-api',
    script: './src/server.js',
    cwd: '$(pwd)/api',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: $API_PORT,
      DB_USER: '${POSTGRES_USER:-cert_user}',
      DB_PASSWORD: '${POSTGRES_PASSWORD:-changeme}',
      DB_HOST: 'localhost',
      DB_NAME: '${POSTGRES_DB:-certificate_db}',
      DB_PORT: $DB_PORT,
      JWT_SECRET: '${JWT_SECRET:-changeme_please}'
    },
    error_file: '/var/log/pm2/certificate-api-error.log',
    out_file: '/var/log/pm2/certificate-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    listen_timeout: 3000,
    kill_timeout: 5000,
  }]
};
EOF

# Start or restart API with PM2
if pm2 list | grep -q certificate-api; then
    print_warn "API already running in PM2"
    read -p "Do you want to restart it? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        print_info "Reloading API..."
        pm2 reload /tmp/ecosystem.config.js
        print_info "API reloaded"
    else
        print_info "Keeping existing API process"
    fi
else
    print_info "Starting API with PM2..."
    pm2 start /tmp/ecosystem.config.js
    pm2 save
    print_info "API started"
fi

# Configure firewall
print_header "Configuring Firewall"

if command -v ufw &> /dev/null; then
    print_info "Opening port $FRONTEND_PORT..."
    sudo ufw allow $FRONTEND_PORT/tcp
    print_info "Firewall configured"
else
    print_warn "UFW not found, please manually open port $FRONTEND_PORT"
fi

# Final verification
print_header "Verifying Deployment"

# Check database
if docker ps | grep -q certificate_db_prod; then
    print_info "✓ Database is running"
else
    print_error "✗ Database is not running"
fi

# Check API
sleep 3
if curl -sf http://localhost:$API_PORT/api/health > /dev/null 2>&1; then
    print_info "✓ API is responding"
else
    print_warn "⚠ API health check failed (might need a moment to start)"
fi

# Check PM2
if pm2 list | grep -q certificate-api; then
    print_info "✓ PM2 process is running"
else
    print_error "✗ PM2 process not found"
fi

# Check Nginx
if sudo systemctl is-active --quiet nginx; then
    print_info "✓ Nginx is running"
else
    print_error "✗ Nginx is not running"
fi

# Check frontend
if curl -sf http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    print_info "✓ Frontend is accessible"
else
    print_warn "⚠ Frontend check failed"
fi

# Summary
print_header "Deployment Complete! 🎉"

echo -e "${GREEN}Your application is deployed and running!${NC}"
echo ""
echo -e "${BLUE}Access Information:${NC}"
echo "  🌐 Application URL: ${GREEN}http://$VPS_IP:$FRONTEND_PORT${NC}"
echo "  🔧 API Endpoint: ${GREEN}http://$VPS_IP:$FRONTEND_PORT/api${NC}"
echo ""
echo -e "${BLUE}Service Status:${NC}"
echo "  • Frontend: Nginx on port $FRONTEND_PORT"
echo "  • API: PM2 on port $API_PORT"
echo "  • Database: Docker on port $DB_PORT"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  ${YELLOW}View API logs:${NC}      pm2 logs certificate-api"
echo "  ${YELLOW}View DB logs:${NC}       docker logs certificate_db_prod"
echo "  ${YELLOW}View Nginx logs:${NC}    sudo tail -f /var/log/nginx/certificate-app-access.log"
echo "  ${YELLOW}Restart API:${NC}        pm2 restart certificate-api"
echo "  ${YELLOW}Restart Nginx:${NC}      sudo systemctl reload nginx"
echo "  ${YELLOW}PM2 status:${NC}         pm2 status"
echo "  ${YELLOW}Docker status:${NC}      docker ps"
echo ""

# Check if there were any warnings
if [ -n "$POSTGRES_PASSWORD" ] && [ "$POSTGRES_PASSWORD" = "changeme" ]; then
    print_warn "⚠️  WARNING: You're using default database credentials!"
    print_warn "Please update your .env file with secure credentials"
fi

if [ -n "$JWT_SECRET" ] && [ "$JWT_SECRET" = "changeme_please" ]; then
    print_warn "⚠️  WARNING: You're using a weak JWT secret!"
    print_warn "Please update your .env file with a strong random secret"
fi

print_info "Deployment completed successfully!"
