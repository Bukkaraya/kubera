# Kubera Production Deployment Guide

This guide covers deploying Kubera on a Raspberry Pi for production use.

## 🎯 Prerequisites

### Hardware Requirements
- **Raspberry Pi 4** (4GB RAM recommended, 2GB minimum)
- **32GB+ microSD card** (Class 10 or better)
- **Stable internet connection**
- **External storage** (optional, for backups)

### Software Requirements
- **Raspberry Pi OS** (64-bit recommended)
- **Docker** and **Docker Compose**
- **Git** (for cloning the repository)

## 🚀 Quick Deployment

### 1. Prepare Your Raspberry Pi

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Reboot to apply changes
sudo reboot
```

### 2. Clone and Deploy

```bash
# Clone the repository
git clone <your-repo-url> kubera
cd kubera

# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The deployment script will:
- ✅ Check system requirements
- ✅ Create necessary directories
- ✅ Generate secure environment configuration
- ✅ Set up Nginx with SSL
- ✅ Build and start all services
- ✅ Display access information

## 🔧 Manual Configuration

### Environment Variables

Edit `.env.prod` to customize your deployment:

```bash
# Database Configuration
DB_PASSWORD=your-secure-password

# Application Security
SECRET_KEY=your-secret-key

# Domain Configuration
DOMAIN_NAME=your-domain.com

# Backup Configuration
BACKUP_RETENTION_DAYS=30
```

### SSL Certificates

For production, replace self-signed certificates:

```bash
# Copy your certificates
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 💾 Database Backup & Restore

### Manual Backup

```bash
# Create a backup
docker-compose -f docker-compose.prod.yml --profile backup up db-backup

# Backups are stored in ./backup/ directory
ls -la backup/
```

### Automated Backups

Set up daily backups with cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/kubera && docker-compose -f docker-compose.prod.yml --profile backup up db-backup
```

### Restore Database

```bash
# List available backups
ls -la backup/

# Restore from backup
docker exec -it kubera-backup /scripts/restore.sh kubera_backup_20250608_143000.sql.gz
```

## 🔍 Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Service Management

```bash
# Check status
docker-compose -f docker-compose.prod.yml ps

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Update and restart
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Health Checks

```bash
# Check application health
curl -k https://your-pi-ip/health

# Check database connection
docker exec kubera-db pg_isready -U kubera_user -d kubera_prod
```

## 🔒 Security Considerations

### Firewall Setup

```bash
# Install UFW
sudo apt install ufw -y

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Backup Strategy

1. **Database backups**: Automated daily backups
2. **Configuration backups**: Backup `.env.prod` and SSL certificates
3. **External storage**: Consider backing up to external drive or cloud

## 🌐 Domain Setup

### DNS Configuration

Point your domain to your Raspberry Pi's public IP:

```
A record: your-domain.com → your-public-ip
CNAME: www.your-domain.com → your-domain.com
```

### Port Forwarding

Configure your router to forward ports:
- **Port 80** (HTTP) → Pi IP:80
- **Port 443** (HTTPS) → Pi IP:443

### Let's Encrypt SSL

For free SSL certificates:

```bash
# Install certbot
sudo apt install certbot -y

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 📊 Performance Optimization

### Raspberry Pi Optimization

```bash
# Increase swap size
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=100/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Enable memory split for GPU (if not using desktop)
echo "gpu_mem=16" | sudo tee -a /boot/config.txt
```

### Docker Optimization

```bash
# Clean up unused Docker resources
docker system prune -a

# Limit log size
echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker
```

## 🆘 Troubleshooting

### Common Issues

**Service won't start:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service-name

# Check disk space
df -h

# Check memory usage
free -h
```

**Database connection issues:**
```bash
# Check database status
docker exec kubera-db pg_isready

# Reset database password
docker-compose -f docker-compose.prod.yml down
docker volume rm kubera_postgres_data
docker-compose -f docker-compose.prod.yml up -d
```

**SSL certificate issues:**
```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Regenerate self-signed certificate
rm ssl/*.pem
./deploy.sh
```

### Performance Issues

**High memory usage:**
```bash
# Reduce worker processes
# Edit docker-compose.prod.yml backend command:
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
```

**Slow database:**
```bash
# Check database size
docker exec kubera-db psql -U kubera_user -d kubera_prod -c "SELECT pg_size_pretty(pg_database_size('kubera_prod'));"

# Vacuum database
docker exec kubera-db psql -U kubera_user -d kubera_prod -c "VACUUM ANALYZE;"
```

## 📞 Support

For issues and questions:
1. Check the logs first
2. Review this troubleshooting guide
3. Check GitHub issues
4. Create a new issue with logs and system info

---

**Happy deploying! 🎉** 