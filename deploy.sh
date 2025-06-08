#!/bin/bash

# Kubera Production Deployment Script for Raspberry Pi
# This script sets up and deploys Kubera in production mode

set -e

echo "🚀 Kubera Production Deployment for Raspberry Pi"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Raspberry Pi
check_raspberry_pi() {
    if [[ -f /proc/device-tree/model ]] && grep -q "Raspberry Pi" /proc/device-tree/model; then
        print_success "Running on Raspberry Pi"
        cat /proc/device-tree/model
        echo ""
    else
        print_warning "Not detected as Raspberry Pi, but continuing..."
    fi
}

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Run: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Run: sudo apt-get install docker-compose-plugin"
        exit 1
    fi
    
    # Check available disk space (minimum 5GB)
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    REQUIRED_SPACE=5242880  # 5GB in KB
    
    if [[ $AVAILABLE_SPACE -lt $REQUIRED_SPACE ]]; then
        print_error "Insufficient disk space. At least 5GB required."
        exit 1
    fi
    
    print_success "System requirements check passed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p data
    mkdir -p backup
    mkdir -p logs/nginx
    mkdir -p nginx/conf.d
    mkdir -p ssl
    mkdir -p scripts
    
    # Make scripts executable
    chmod +x scripts/*.sh 2>/dev/null || true
    
    print_success "Directories created"
}

# Generate environment file if it doesn't exist
generate_env_file() {
    if [[ ! -f .env.prod ]]; then
        print_status "Generating production environment file..."
        
        # Generate random secret key
        SECRET_KEY=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
        
        cat > .env.prod << EOF
# Kubera Production Environment Configuration
# Generated on $(date)

# Application Security
SECRET_KEY=${SECRET_KEY}

# Domain Configuration (Update these with your actual domain)
DOMAIN_NAME=your-domain.com

# Backup Configuration
BACKUP_RETENTION_DAYS=30

# Application Settings
ENVIRONMENT=production
LOG_LEVEL=INFO

# Database Configuration (SQLite)
# Database file will be stored in ./data/kubera.db
EOF
        
        print_success "Environment file created: .env.prod"
        print_warning "Please update DOMAIN_NAME in .env.prod with your actual domain"
    else
        print_status "Using existing .env.prod file"
    fi
}

# Create nginx configuration
create_nginx_config() {
    print_status "Creating Nginx configuration..."
    
    cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    include /etc/nginx/conf.d/*.conf;
}
EOF

    cat > nginx/conf.d/kubera.conf << 'EOF'
# Kubera Application Configuration

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream backend
upstream kubera_backend {
    server backend:8000;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name _;
    
    # SSL Configuration (update with your certificates)
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Frontend static files
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://kubera_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://kubera_backend/health;
        access_log off;
    }
}
EOF
    
    print_success "Nginx configuration created"
}

# Create SSL certificates (self-signed for development)
create_ssl_certificates() {
    if [[ ! -f ssl/cert.pem ]] || [[ ! -f ssl/key.pem ]]; then
        print_status "Creating self-signed SSL certificates..."
        print_warning "For production, replace with proper SSL certificates"
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=kubera.local"
        
        print_success "Self-signed SSL certificates created"
    else
        print_status "SSL certificates already exist"
    fi
}

# Build and deploy
deploy_application() {
    print_status "Building and deploying Kubera..."
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml --env-file .env.prod pull nginx alpine
    
    # Build application images
    docker-compose -f docker-compose.prod.yml --env-file .env.prod build
    
    # Start services
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    
    print_success "Kubera deployed successfully!"
}

# Show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    
    docker-compose -f docker-compose.prod.yml --env-file .env.prod ps
    
    echo ""
    print_status "Application URLs:"
    echo "🌐 Web Interface: https://$(hostname -I | awk '{print $1}')"
    echo "📊 API Health: https://$(hostname -I | awk '{print $1}')/health"
    
    echo ""
    print_status "Useful Commands:"
    echo "📋 View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "🔄 Restart: docker-compose -f docker-compose.prod.yml restart"
    echo "🛑 Stop: docker-compose -f docker-compose.prod.yml down"
    echo "💾 Backup DB: docker-compose -f docker-compose.prod.yml --profile backup up db-backup"
    echo "🗄️ Direct backup: docker run --rm -v ./data:/data:ro -v ./backup:/backup -v ./scripts:/scripts alpine:latest /scripts/sqlite-backup.sh"
}

# Main deployment flow
main() {
    check_raspberry_pi
    check_requirements
    create_directories
    generate_env_file
    create_nginx_config
    create_ssl_certificates
    deploy_application
    show_status
    
    echo ""
    print_success "🎉 Kubera deployment completed successfully!"
    print_warning "Don't forget to:"
    echo "  1. Update DOMAIN_NAME in .env.prod"
    echo "  2. Replace self-signed SSL certificates with proper ones"
    echo "  3. Set up automated backups with cron"
}

# Run main function
main "$@" 