#!/bin/bash

# VPS Setup Script for Certificate Management App
# This installs all prerequisites: Docker, Node.js, PM2, and configures the system
# Run this ONCE on a fresh VPS or when setting up for the first time
#
# Usage:
#   wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/deployment/setup-vps.sh
#   chmod +x setup-vps.sh
#   sudo ./setup-vps.sh

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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_header "VPS Setup for Certificate Management App"

# Get the actual user (not root)
if [ -n "$SUDO_USER" ]; then
    ACTUAL_USER=$SUDO_USER
else
    ACTUAL_USER=$(whoami)
fi

print_info "Running as: $ACTUAL_USER"

# Update system
print_header "Step 1: Updating System Packages"
apt-get update
apt-get upgrade -y
print_info "System updated"

# Install basic utilities
print_header "Step 2: Installing Basic Utilities"
apt-get install -y \
    curl \
    wget \
    git \
    ufw \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    build-essential
print_info "Basic utilities installed"

# Install Docker
print_header "Step 3: Installing Docker"

if command -v docker &> /dev/null; then
    print_warn "Docker already installed"
    docker --version
else
    print_info "Installing Docker..."

    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add user to docker group
    usermod -aG docker $ACTUAL_USER

    # Enable Docker service
    systemctl enable docker
    systemctl start docker

    print_info "Docker installed successfully"
    docker --version
fi

# Install Docker Compose (standalone - backup method)
print_header "Step 4: Installing Docker Compose"

if command -v docker-compose &> /dev/null; then
    print_warn "Docker Compose already installed"
    docker-compose --version
else
    print_info "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    print_info "Docker Compose installed"
    docker-compose --version
fi

# Install Node.js 18 LTS
print_header "Step 5: Installing Node.js 18 LTS"

if command -v node &> /dev/null; then
    CURRENT_NODE_VERSION=$(node -v)
    print_warn "Node.js already installed: $CURRENT_NODE_VERSION"

    # Check if we need to update
    MAJOR_VERSION=$(echo $CURRENT_NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        print_warn "Node.js version is old, updating to v18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
else
    print_info "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    print_info "Node.js installed"
fi

node --version
npm --version

# Install PM2
print_header "Step 6: Installing PM2 Process Manager"

if command -v pm2 &> /dev/null; then
    print_warn "PM2 already installed"
    pm2 --version
else
    print_info "Installing PM2 globally..."
    npm install -g pm2

    # Setup PM2 startup script
    env PATH=$PATH:/usr/bin pm2 startup systemd -u $ACTUAL_USER --hp /home/$ACTUAL_USER

    print_info "PM2 installed"
    pm2 --version
fi

# Install and configure Nginx
print_header "Step 7: Installing and Configuring Nginx"

if command -v nginx &> /dev/null; then
    print_warn "Nginx already installed"
    nginx -v
else
    print_info "Installing Nginx..."
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    print_info "Nginx installed"
    nginx -v
fi

# Configure firewall
print_header "Step 8: Configuring Firewall (UFW)"

if command -v ufw &> /dev/null; then
    print_info "Configuring UFW firewall..."

    # Allow SSH (important!)
    ufw allow OpenSSH
    ufw allow 22/tcp

    # Allow existing app (assuming port 80 for domain)
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Allow new certificate app
    ufw allow 8080/tcp

    # Enable UFW (with --force to avoid interactive prompt)
    print_warn "Enabling firewall..."
    ufw --force enable

    print_info "Firewall configured"
    ufw status
else
    print_warn "UFW not available, skipping firewall configuration"
fi

# Create application directory
print_header "Step 9: Creating Application Directory"

APP_DIR="/var/www/certificate-app"
if [ -d "$APP_DIR" ]; then
    print_warn "Application directory already exists: $APP_DIR"
else
    mkdir -p $APP_DIR
    chown -R $ACTUAL_USER:$ACTUAL_USER $APP_DIR
    print_info "Application directory created: $APP_DIR"
fi

# Create log directories
print_info "Creating log directories..."
mkdir -p /var/log/pm2
chown -R $ACTUAL_USER:$ACTUAL_USER /var/log/pm2

mkdir -p /var/log/nginx
chown -R www-data:www-data /var/log/nginx

# Create PostgreSQL data directory
print_info "Creating PostgreSQL data directory..."
mkdir -p /var/lib/postgresql/certificate-app
chown -R $ACTUAL_USER:$ACTUAL_USER /var/lib/postgresql/certificate-app

# System optimization
print_header "Step 10: System Optimization"

# Increase file limits for Node.js
print_info "Setting file limits..."
cat > /etc/security/limits.d/nodejs.conf << EOF
$ACTUAL_USER soft nofile 65536
$ACTUAL_USER hard nofile 65536
EOF

# Configure swap if not exists (for low-memory VPS)
if [ ! -f /swapfile ]; then
    TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
    if [ "$TOTAL_MEM" -lt 2048 ]; then
        print_info "Low memory detected ($TOTAL_MEM MB), creating 2GB swap..."
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        print_info "Swap created"
    fi
else
    print_info "Swap already configured"
fi

# Install git (if not already)
print_header "Step 11: Ensuring Git is Installed"
if command -v git &> /dev/null; then
    print_info "Git already installed"
    git --version
else
    apt-get install -y git
    print_info "Git installed"
fi

# Summary
print_header "Installation Complete! 🎉"

echo -e "${GREEN}Installed Components:${NC}"
echo "  • Docker: $(docker --version)"
echo "  • Docker Compose: $(docker-compose --version)"
echo "  • Node.js: $(node --version)"
echo "  • npm: $(npm --version)"
echo "  • PM2: $(pm2 --version)"
echo "  • Nginx: $(nginx -v 2>&1)"
echo "  • Git: $(git --version)"
echo ""

echo -e "${YELLOW}Open Ports:${NC}"
echo "  • 22 (SSH)"
echo "  • 80 (HTTP - existing app)"
echo "  • 443 (HTTPS - existing app)"
echo "  • 8080 (Certificate App)"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Clone your repository:"
echo "     ${GREEN}cd /var/www/certificate-app${NC}"
echo "     ${GREEN}git clone https://github.com/akashi7/IR-ASSESS.git .${NC}"
echo ""
echo "  2. Run the deployment script:"
echo "     ${GREEN}cd /var/www/certificate-app${NC}"
echo "     ${GREEN}bash deployment/deploy-from-github.sh${NC}"
echo ""

print_warn "IMPORTANT: You may need to log out and back in for Docker permissions to take effect"
print_info "Setup complete! Your VPS is ready for deployment."
