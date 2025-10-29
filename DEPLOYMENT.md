# PDF Service Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the PDF Service to production environments. It covers various deployment scenarios, configuration management, monitoring setup, and maintenance procedures.

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                    Production Deployment                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   Load Balancer │    │   Reverse Proxy │    │   SSL/TLS   │  │
│  │   (Nginx)       │    │   (Nginx)       │    │   Termination│  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                       │                       │      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   App Server 1  │    │   App Server 2  │    │   App Server│  │
│  │   (Node.js)     │    │   (Node.js)     │    │   3 (Node.js)│  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                       │                       │      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   File Storage  │    │   Session Store │    │   Log       │  │
│  │   (Local/Cloud) │    │   (Redis)       │    │   Storage   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Deployment Components

1. **Load Balancer**: Distributes traffic across multiple app servers
2. **Reverse Proxy**: Handles SSL termination and static file serving
3. **Application Servers**: Run the Node.js application
4. **File Storage**: Stores user data and generated PDFs
5. **Session Store**: Manages user sessions (Redis)
6. **Log Storage**: Centralized logging system

## Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 50GB SSD
- Network: 100Mbps

**Recommended Requirements:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 100GB+ SSD
- Network: 1Gbps

### Software Requirements

- **Operating System**: Ubuntu 20.04 LTS, CentOS 8+, or Windows Server 2019+
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Nginx**: Version 1.18.0 or higher
- **PM2**: Version 5.0.0 or higher
- **Redis**: Version 6.0.0 or higher (optional)

## Deployment Methods

### Method 1: Traditional Server Deployment

#### Step 1: Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2

# Install Redis (optional)
sudo apt install redis-server -y
```

#### Step 2: Application Deployment

```bash
# Create application directory
sudo mkdir -p /opt/pdf-service
sudo chown $USER:$USER /opt/pdf-service

# Clone repository
cd /opt/pdf-service
git clone https://github.com/your-org/html-to-pdf-service-node.git .

# Install dependencies
npm ci --only=production

# Create necessary directories
mkdir -p database/users database/config database/sessions
mkdir -p logs uploads temp

# Set permissions
chmod 755 database/
chmod 644 database/users/*.json 2>/dev/null || true
```

#### Step 3: Environment Configuration

```bash
# Create production environment file
cat > .env << EOF
NODE_ENV=production
PORT=9005
HOST=0.0.0.0

# Security
SESSION_SECRET=$(openssl rand -base64 32)
CSRF_SECRET=$(openssl rand -base64 32)
BCRYPT_ROUNDS=12

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@your-domain.com

# File Storage
UPLOAD_DIR=/opt/pdf-service/uploads
TEMP_DIR=/opt/pdf-service/temp
MAX_FILE_SIZE=10485760

# Rate Limiting
DEFAULT_RATE_LIMIT=1000
RATE_LIMIT_WINDOW=3600000

# Logging
LOG_LEVEL=info
LOG_FILE=/opt/pdf-service/logs/app.log
EOF
```

#### Step 4: PM2 Configuration

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'pdf-service',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 9005
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=4096'
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Step 5: Nginx Configuration

```bash
# Create Nginx configuration
sudo cat > /etc/nginx/sites-available/pdf-service << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/s;

    # API Routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:9005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Authentication Routes
    location /auth/ {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://localhost:9005;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Dashboard Routes
    location /dashboard/ {
        proxy_pass http://localhost:9005;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static Files
    location / {
        root /opt/pdf-service/public;
        try_files \$uri \$uri/ @fallback;
    }

    location @fallback {
        proxy_pass http://localhost:9005;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # File Upload Size
    client_max_body_size 10M;
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/pdf-service /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Method 2: Docker Deployment

#### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p database/users database/config database/sessions logs uploads temp

# Set permissions
RUN chmod 755 database/

# Expose port
EXPOSE 9005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:9005/health || exit 1

# Start application
CMD ["node", "app.js"]
```

#### Step 2: Create Docker Compose

```yaml
version: '3.8'

services:
  pdf-service:
    build: .
    ports:
      - "9005:9005"
    environment:
      - NODE_ENV=production
      - PORT=9005
      - SESSION_SECRET=${SESSION_SECRET}
      - CSRF_SECRET=${CSRF_SECRET}
    volumes:
      - ./database:/app/database
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9005/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - pdf-service
    restart: unless-stopped

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

#### Step 3: Deploy with Docker

```bash
# Create environment file
cat > .env << EOF
SESSION_SECRET=$(openssl rand -base64 32)
CSRF_SECRET=$(openssl rand -base64 32)
EOF

# Build and start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

### Method 3: Cloud Platform Deployment

#### AWS EC2 Deployment

```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-12345678 \
  --subnet-id subnet-12345678 \
  --user-data file://user-data.sh
```

#### Google Cloud Platform

```bash
# Create VM instance
gcloud compute instances create pdf-service \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --machine-type=e2-medium \
  --zone=us-central1-a \
  --tags=http-server,https-server \
  --metadata-from-file startup-script=startup-script.sh
```

#### Azure Deployment

```bash
# Create resource group
az group create --name pdf-service-rg --location eastus

# Create VM
az vm create \
  --resource-group pdf-service-rg \
  --name pdf-service-vm \
  --image UbuntuLTS \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys
```

## SSL/TLS Configuration

### Let's Encrypt SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Custom SSL Certificate

```bash
# Copy certificate files
sudo cp your-domain.crt /etc/ssl/certs/
sudo cp your-domain.key /etc/ssl/private/
sudo chmod 600 /etc/ssl/private/your-domain.key

# Update Nginx configuration
sudo nano /etc/nginx/sites-available/pdf-service
```

## Monitoring and Logging

### Application Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor application
pm2 monit

# View logs
pm2 logs pdf-service
tail -f logs/app.log
```

### Log Rotation

```bash
# Create logrotate configuration
sudo cat > /etc/logrotate.d/pdf-service << EOF
/opt/pdf-service/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload pdf-service
    endscript
}
EOF
```

### Health Checks

```bash
# Create health check script
cat > health-check.sh << EOF
#!/bin/bash

# Check if application is running
if ! pm2 list | grep -q "pdf-service.*online"; then
    echo "Application is not running"
    exit 1
fi

# Check if port is listening
if ! netstat -tlnp | grep -q ":9005"; then
    echo "Port 9005 is not listening"
    exit 1
fi

# Check disk space
DISK_USAGE=$(df /opt/pdf-service | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage is high: $DISK_USAGE%"
    exit 1
fi

echo "Health check passed"
exit 0
EOF

chmod +x health-check.sh

# Add to crontab
echo "*/5 * * * * /opt/pdf-service/health-check.sh" | crontab -
```

## Backup and Recovery

### Database Backup

```bash
# Create backup script
cat > backup.sh << EOF
#!/bin/bash

BACKUP_DIR="/opt/backups/pdf-service"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
tar -czf $BACKUP_DIR/database_$DATE.tar.gz database/

# Backup configuration
cp .env $BACKUP_DIR/env_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "env_*" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh

# Schedule daily backups
echo "0 2 * * * /opt/pdf-service/backup.sh" | crontab -
```

### Recovery Procedure

```bash
# Stop application
pm2 stop pdf-service

# Restore database
tar -xzf /opt/backups/pdf-service/database_20240101_020000.tar.gz

# Restore configuration
cp /opt/backups/pdf-service/env_20240101_020000 .env

# Start application
pm2 start pdf-service
```

## Performance Optimization

### System Optimization

```bash
# Increase file descriptor limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimize kernel parameters
cat >> /etc/sysctl.conf << EOF
net.core.somaxconn = 65536
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65536
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 10
EOF

sysctl -p
```

### Application Optimization

```bash
# Optimize PM2 configuration
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'pdf-service',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 9005
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=4096 --optimize-for-size',
    min_uptime: '10s',
    max_restarts: 5,
    restart_delay: 4000
  }]
};
EOF
```

## Security Hardening

### Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### System Security

```bash
# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Change SSH port
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# Restart SSH service
sudo systemctl restart ssh
```

### Application Security

```bash
# Set secure file permissions
chmod 600 .env
chmod 644 database/users/*.json
chmod 755 database/

# Enable fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Maintenance Procedures

### Regular Maintenance

```bash
# Weekly maintenance script
cat > weekly-maintenance.sh << EOF
#!/bin/bash

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean up old logs
find logs/ -name "*.log" -mtime +30 -delete

# Clean up temporary files
find temp/ -type f -mtime +1 -delete

# Restart application
pm2 restart pdf-service

echo "Weekly maintenance completed"
EOF

chmod +x weekly-maintenance.sh

# Schedule weekly maintenance
echo "0 3 * * 0 /opt/pdf-service/weekly-maintenance.sh" | crontab -
```

### Update Procedure

```bash
# Create update script
cat > update.sh << EOF
#!/bin/bash

# Backup current version
cp -r . ../pdf-service-backup-$(date +%Y%m%d)

# Pull latest changes
git pull origin main

# Install new dependencies
npm ci --only=production

# Restart application
pm2 restart pdf-service

echo "Update completed"
EOF

chmod +x update.sh
```

## Troubleshooting

### Common Issues

1. **Application Won't Start**
   ```bash
   # Check logs
   pm2 logs pdf-service
   tail -f logs/app.log
   
   # Check port availability
   netstat -tlnp | grep 9005
   
   # Check dependencies
   npm list
   ```

2. **High Memory Usage**
   ```bash
   # Monitor memory usage
   htop
   pm2 monit
   
   # Restart application
   pm2 restart pdf-service
   ```

3. **PDF Generation Failures**
   ```bash
   # Check Puppeteer installation
   node -e "console.log(require('puppeteer').executablePath())"
   
   # Check browser launch
   node -e "const puppeteer = require('puppeteer'); puppeteer.launch().then(b => b.close())"
   ```

### Performance Issues

1. **Slow Response Times**
   - Check server resources (CPU, RAM, disk)
   - Monitor network latency
   - Review application logs
   - Optimize database queries

2. **High Error Rates**
   - Check error logs
   - Monitor rate limiting
   - Review input validation
   - Check external dependencies

## Scaling Considerations

### Horizontal Scaling

```bash
# Load balancer configuration
upstream pdf_service {
    server 10.0.1.10:9005;
    server 10.0.1.11:9005;
    server 10.0.1.12:9005;
}

server {
    location / {
        proxy_pass http://pdf_service;
    }
}
```

### Database Scaling

```bash
# Migrate to MongoDB
npm install mongodb

# Update configuration
cat >> .env << EOF
MONGODB_URI=mongodb://localhost:27017/pdf-service
MONGODB_DATABASE=pdf-service
EOF
```

This deployment guide provides comprehensive instructions for deploying the PDF Service to production environments. Follow these procedures to ensure a secure, scalable, and maintainable deployment.
