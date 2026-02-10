#!/bin/bash

# Automated deployment script for Certificate Management App
# Usage: ./deploy.sh [local|vps]

set -e  # Exit on error

VPS_IP="144.91.122.113"
VPS_USER="root"
APP_DIR="/var/www/certificate-app"
LOCAL_PROJECT_DIR="/home/akashi/Documents/applications/irembo"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running locally or on VPS
if [ "$1" == "local" ]; then
    print_info "Running local build and upload..."

    # Build frontend
    print_info "Building frontend..."
    cd "$LOCAL_PROJECT_DIR/frontend"
    npm install
    npm run build

    # Upload files to VPS
    print_info "Uploading files to VPS..."

    # Upload API
    print_info "Uploading API..."
    rsync -avz --exclude 'node_modules' --exclude 'tests' \
        "$LOCAL_PROJECT_DIR/api/" \
        "$VPS_USER@$VPS_IP:$APP_DIR/api/"

    # Upload frontend
    print_info "Uploading frontend..."
    rsync -avz \
        "$LOCAL_PROJECT_DIR/frontend/dist/certificate-management-frontend/" \
        "$VPS_USER@$VPS_IP:$APP_DIR/frontend/"

    # Upload deployment files
    print_info "Uploading deployment configs..."
    scp "$LOCAL_PROJECT_DIR/deployment/ecosystem.config.js" \
        "$VPS_USER@$VPS_IP:$APP_DIR/"

    scp "$LOCAL_PROJECT_DIR/deployment/nginx-vps.conf" \
        "$VPS_USER@$VPS_IP:/tmp/"

    scp "$LOCAL_PROJECT_DIR/deployment/docker-compose.prod.yml" \
        "$VPS_USER@$VPS_IP:$APP_DIR/"

    if [ ! -f "$LOCAL_PROJECT_DIR/.env" ]; then
        print_warn ".env file not found locally, copying example..."
        scp "$LOCAL_PROJECT_DIR/.env.example" \
            "$VPS_USER@$VPS_IP:$APP_DIR/.env"
        print_warn "Remember to edit .env on VPS with actual credentials!"
    else
        scp "$LOCAL_PROJECT_DIR/.env" \
            "$VPS_USER@$VPS_IP:$APP_DIR/"
    fi

    print_info "Upload complete!"
    print_info "Now run: ssh $VPS_USER@$VPS_IP"
    print_info "Then run: cd $APP_DIR && bash deployment/deploy.sh vps"

elif [ "$1" == "vps" ]; then
    print_info "Running VPS setup..."

    # Check if running on VPS
    if [ ! -d "$APP_DIR" ]; then
        print_error "App directory not found. Are you on the VPS?"
        exit 1
    fi

    cd "$APP_DIR"

    # Install API dependencies
    print_info "Installing API dependencies..."
    cd "$APP_DIR/api"
    npm install --production

    # Set up database
    print_info "Setting up database..."
    cd "$APP_DIR"

    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running"
        exit 1
    fi

    # Start database if not running
    if ! docker ps | grep -q certificate_db_prod; then
        print_info "Starting database..."
        docker-compose -f docker-compose.prod.yml up -d
        print_info "Waiting for database to be ready..."
        sleep 10
    else
        print_info "Database already running"
    fi

    # Set up Nginx
    print_info "Configuring Nginx..."
    if [ ! -f /etc/nginx/sites-available/certificate-app ]; then
        sudo cp /tmp/nginx-vps.conf /etc/nginx/sites-available/certificate-app
        sudo ln -s /etc/nginx/sites-available/certificate-app /etc/nginx/sites-enabled/
        print_info "Nginx config created"
    else
        print_warn "Nginx config already exists, updating..."
        sudo cp /tmp/nginx-vps.conf /etc/nginx/sites-available/certificate-app
    fi

    # Test Nginx config
    if sudo nginx -t; then
        print_info "Nginx config is valid"
        sudo systemctl reload nginx
    else
        print_error "Nginx config has errors"
        exit 1
    fi

    # Set up PM2
    print_info "Setting up PM2..."

    # Check if app is already running
    if pm2 list | grep -q certificate-api; then
        print_info "Restarting existing PM2 app..."
        pm2 restart certificate-api
    else
        print_info "Starting new PM2 app..."
        pm2 start ecosystem.config.js
        pm2 save
    fi

    # Open firewall
    print_info "Configuring firewall..."
    if command -v ufw > /dev/null; then
        sudo ufw allow 8080/tcp
        print_info "Firewall rule added for port 8080"
    else
        print_warn "UFW not found, please manually open port 8080"
    fi

    # Show status
    print_info "Deployment complete!"
    echo ""
    print_info "=== Service Status ==="
    echo ""

    print_info "Database:"
    docker ps | grep certificate_db_prod || print_error "Database not running"

    print_info "API:"
    pm2 list | grep certificate-api || print_error "API not running"

    print_info "Nginx:"
    sudo systemctl status nginx --no-pager -l || print_error "Nginx not running"

    echo ""
    print_info "=== Access Information ==="
    print_info "Application URL: http://$VPS_IP:8080"
    print_info "API Health: http://localhost:3001/api/health"
    echo ""

    print_info "=== Useful Commands ==="
    print_info "View API logs: pm2 logs certificate-api"
    print_info "View DB logs: docker logs certificate_db_prod"
    print_info "View Nginx logs: sudo tail -f /var/log/nginx/certificate-app-access.log"
    print_info "Restart API: pm2 restart certificate-api"
    print_info "Restart Nginx: sudo systemctl reload nginx"

else
    print_error "Usage: $0 [local|vps]"
    echo ""
    echo "  local - Build and upload from local machine"
    echo "  vps   - Deploy on VPS (run this after 'local')"
    exit 1
fi
