

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

print_header "Minimal VPS Setup (PM2 & Nginx Already Installed)"

# Get the actual user (not root)
if [ -n "$SUDO_USER" ]; then
    ACTUAL_USER=$SUDO_USER
else
    ACTUAL_USER=$(whoami)
fi

print_info "Running as: $ACTUAL_USER"

# Check existing services
print_header "Checking Existing Services"

if command -v pm2 &> /dev/null; then
    print_info "PM2 already installed: $(pm2 --version)"
else
    print_warn "PM2 not found - will install"
fi

if command -v nginx &> /dev/null; then
    print_info "Nginx already installed: $(nginx -v 2>&1)"
else
    print_warn "Nginx not found - will install"
fi

# Update system
print_header "Updating System Packages"
apt-get update
apt-get upgrade -y
print_info "System updated"

# Install basic utilities
print_header "Installing Basic Utilities"
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
print_header "Installing Docker"

if command -v docker &> /dev/null; then
    print_warn "Docker already installed: $(docker --version)"
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

    print_info "Docker installed successfully: $(docker --version)"
fi

# Install Docker Compose (standalone)
print_header "Installing Docker Compose"

if command -v docker-compose &> /dev/null; then
    print_warn "Docker Compose already installed: $(docker-compose --version)"
else
    print_info "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    print_info "Docker Compose installed: $(docker-compose --version)"
fi

# Install Node.js 18 LTS
print_header "Installing Node.js 18 LTS"

if command -v node &> /dev/null; then
    CURRENT_NODE_VERSION=$(node -v)
    print_warn "Node.js already installed: $CURRENT_NODE_VERSION"

    # Check if we need to update
    MAJOR_VERSION=$(echo $CURRENT_NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        print_warn "Node.js version is old, updating to v18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
        print_info "Node.js updated: $(node --version)"
    fi
else
    print_info "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    print_info "Node.js installed: $(node --version)"
fi

# Only install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    print_header "Installing PM2 Process Manager"
    npm install -g pm2
    env PATH=$PATH:/usr/bin pm2 startup systemd -u $ACTUAL_USER --hp /home/$ACTUAL_USER
    print_info "PM2 installed: $(pm2 --version)"
fi

# Only install Nginx if not present
if ! command -v nginx &> /dev/null; then
    print_header "Installing Nginx"
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    print_info "Nginx installed: $(nginx -v 2>&1)"
fi

# Configure firewall (without disrupting existing rules)
print_header "Configuring Firewall"

if command -v ufw &> /dev/null; then
    print_info "Adding firewall rule for certificate app (port 8080)..."

    # Only add if not already present
    if ! ufw status | grep -q "8080"; then
        ufw allow 8080/tcp
        print_info "Port 8080 opened"
    else
        print_info "Port 8080 already open"
    fi

    # Don't enable UFW if it's not already enabled (might break existing setup)
    if ufw status | grep -q "Status: active"; then
        print_info "Firewall already active"
    else
        print_warn "Firewall not active - you may want to enable it manually"
        print_warn "Run: sudo ufw enable (after ensuring SSH is allowed!)"
    fi
else
    print_warn "UFW not available"
fi

# Create application directory
print_header "Creating Application Directory"

APP_DIR="/var/www/certificate-app"
if [ -d "$APP_DIR" ]; then
    print_warn "Application directory already exists: $APP_DIR"
else
    mkdir -p $APP_DIR
    chown -R $ACTUAL_USER:$ACTUAL_USER $APP_DIR
    print_info "Application directory created: $APP_DIR"
fi

# Create log directories
print_info "Ensuring log directories exist..."
mkdir -p /var/log/pm2
chown -R $ACTUAL_USER:$ACTUAL_USER /var/log/pm2

# Create PostgreSQL data directory
print_info "Creating PostgreSQL data directory..."
mkdir -p /var/lib/postgresql/certificate-app
chown -R $ACTUAL_USER:$ACTUAL_USER /var/lib/postgresql/certificate-app

# Summary
print_header "Installation Complete! 🎉"

echo -e "${GREEN}Installed/Verified Components:${NC}"
echo "  • Docker: $(docker --version)"
echo "  • Docker Compose: $(docker-compose --version)"
echo "  • Node.js: $(node --version)"
echo "  • npm: $(npm --version)"
echo "  • PM2: $(pm2 --version 2>/dev/null || echo 'already installed')"
echo "  • Nginx: $(nginx -v 2>&1)"
echo "  • Git: $(git --version)"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Clone your repository:"
echo "     ${GREEN}cd /var/www/certificate-app${NC}"
echo "     ${GREEN}git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git .${NC}"
echo ""
echo "  2. Configure environment:"
echo "     ${GREEN}cp .env.example .env && nano .env${NC}"
echo ""
echo "  3. Run the deployment script:"
echo "     ${GREEN}bash deployment/deploy-from-github.sh${NC}"
echo ""

print_warn "IMPORTANT: You may need to log out and back in for Docker permissions to take effect"
print_info "Setup complete! Your VPS is ready for deployment."
