# 🚀 Production Deployment & Auto-Update Guide

## Overview

This guide explains how to deploy your Mr. Mobile app to production and set up **automatic updates** so whenever you push code to GitHub, your live production app updates automatically!

---

## 📋 Table of Contents

1. [Quick Overview](#quick-overview)
2. [Initial Production Setup](#initial-production-setup)
3. [Method 1: GitHub Actions Auto-Deploy (Recommended)](#method-1-github-actions-auto-deploy)
4. [Method 2: Webhook Auto-Deploy](#method-2-webhook-auto-deploy)
5. [Method 3: Manual Deploy Script](#method-3-manual-deploy-script)
6. [Rollback & Emergency Procedures](#rollback--emergency-procedures)
7. [Monitoring & Logs](#monitoring--logs)

---

## 🎯 Quick Overview

### Current Workflow (Manual)
```
You push code → GitHub Actions builds → You SSH to server → You pull & restart
```

### New Workflow (Automatic) ✨
```
You push code → GitHub Actions builds → Production auto-updates → App live!
```

**Time saved**: 5-10 minutes per deployment!

---

## 🏗️ Initial Production Setup

### Prerequisites

1. **Production Server** (DigitalOcean, AWS, Azure, etc.)
   - Linux (Ubuntu 20.04+ recommended)
   - Docker & Docker Compose installed
   - SSH access

2. **Domain Name** (optional but recommended)
   - Example: `mrmobile.com` or `shop.yourdomain.com`

3. **GitHub Repository**
   - Code pushed to GitHub
   - CI/CD pipeline running

### Step 1: Prepare Production Server

SSH into your production server:

```bash
ssh your-username@your-server.com
```

Install Docker and Docker Compose:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Clone Repository on Server

```bash
# Create app directory
sudo mkdir -p /opt/mr-mobile
sudo chown $USER:$USER /opt/mr-mobile

# Clone repository
cd /opt/mr-mobile
git clone https://github.com/YOUR_USERNAME/mr-mobile.git .
```

### Step 3: Configure Environment Variables

```bash
# Create production environment file
cd /opt/mr-mobile
nano .env.production
```

Add your production environment variables:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@your-neon-db.neon.tech/mrmobile?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"  # or http://your-ip:3000
NEXTAUTH_SECRET="generate-a-strong-secret-key-here"

# Redis (Upstash)
REDIS_URL="rediss://default:password@your-redis.upstash.io:6379"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Resend Email
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="noreply@your-domain.com"

# Payment Gateways (optional)
EASYPAISA_STORE_ID="your-store-id"
EASYPAISA_API_KEY="your-api-key"
JAZZCASH_MERCHANT_ID="your-merchant-id"
JAZZCASH_PASSWORD="your-password"

# App Settings
NODE_ENV="production"
```

Save and exit (Ctrl+X, Y, Enter).

### Step 4: Initial Deployment

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Login to GitHub Container Registry
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Update docker-compose.yml with your image
nano docker-compose.yml
```

Update the image name in `docker-compose.yml`:

```yaml
services:
  app:
    image: ghcr.io/YOUR_USERNAME/mr-mobile:latest
    # ... rest of config
```

Deploy the application:

```bash
# Pull latest image
docker-compose pull

# Start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 5: Verify Deployment

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Expected output: {"status":"ok"}
```

Access your app:
- Local: `http://localhost:3000`
- Public: `http://YOUR_SERVER_IP:3000`

---

## 🤖 Method 1: GitHub Actions Auto-Deploy (Recommended)

This method automatically deploys when you push to the `main` branch.

### Step 1: Generate SSH Key for GitHub Actions

On your **local machine** (not server):

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions@mr-mobile" -f ~/.ssh/github_actions_mr_mobile

# This creates two files:
# ~/.ssh/github_actions_mr_mobile (private key)
# ~/.ssh/github_actions_mr_mobile.pub (public key)
```

### Step 2: Add Public Key to Production Server

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions_mr_mobile.pub your-username@your-server.com

# Or manually:
cat ~/.ssh/github_actions_mr_mobile.pub
# Then SSH to server and add to ~/.ssh/authorized_keys
```

### Step 3: Add Secrets to GitHub

Go to your GitHub repository:
1. Click **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Add these secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `PRODUCTION_HOST` | Your server IP or domain | `123.456.789.0` or `mrmobile.com` |
| `PRODUCTION_USER` | SSH username | `root` or `ubuntu` |
| `PRODUCTION_SSH_KEY` | Private key content | Paste content of `~/.ssh/github_actions_mr_mobile` |
| `PRODUCTION_PORT` | SSH port (optional) | `22` (default) |

To get private key content:

```bash
cat ~/.ssh/github_actions_mr_mobile
# Copy entire output including -----BEGIN/END----- lines
```

### Step 4: Enable Auto-Deploy Workflow

The workflow file already exists at `.github/workflows/deploy-production.yml`.

Update it with your repository details:

```bash
# Edit the workflow file
nano .github/workflows/deploy-production.yml
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 5: Test Auto-Deploy

```bash
# Make a small change
echo "# Auto-deploy test" >> README.md

# Commit and push
git add README.md
git commit -m "Test auto-deploy"
git push origin main
```

Watch the deployment:
1. Go to GitHub → **Actions** tab
2. You'll see two workflows running:
   - ✅ "CI/CD Pipeline" (builds Docker image)
   - 🚀 "Deploy to Production" (deploys to server)

### Step 6: Verify Auto-Deploy

After GitHub Actions completes (~20 minutes):

```bash
# SSH to your server
ssh your-username@your-server.com

# Check running containers
docker-compose ps

# Check logs
docker-compose logs --tail=50

# Verify health
curl http://localhost:3000/api/health
```

---

## 🔔 Method 2: Webhook Auto-Deploy

This method uses GitHub webhooks to trigger deployment instantly.

### Step 1: Install Webhook Listener on Server

```bash
# Install webhook listener
cd /opt/mr-mobile
npm install -g github-webhook-handler

# Or use Python alternative
# pip3 install flask
```

### Step 2: Create Webhook Server

Create `/opt/mr-mobile/webhook-server.js`:

```javascript
const http = require('http');
const createHandler = require('github-webhook-handler');
const { exec } = require('child_process');

const handler = createHandler({ 
  path: '/webhook', 
  secret: 'YOUR_WEBHOOK_SECRET' // Change this!
});

http.createServer((req, res) => {
  handler(req, res, (err) => {
    res.statusCode = 404;
    res.end('no such location');
  });
}).listen(7777);

handler.on('error', (err) => {
  console.error('Error:', err.message);
});

handler.on('push', (event) => {
  console.log('Received push event for %s to %s',
    event.payload.repository.name,
    event.payload.ref);
  
  if (event.payload.ref === 'refs/heads/main') {
    console.log('Deploying to production...');
    exec('bash /opt/mr-mobile/scripts/webhook-deploy.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`Deployment error: ${error}`);
        return;
      }
      console.log(`Deployment output: ${stdout}`);
    });
  }
});

console.log('Webhook server running on port 7777');
```

### Step 3: Run Webhook Server as Service

Create systemd service:

```bash
sudo nano /etc/systemd/system/mr-mobile-webhook.service
```

Add:

```ini
[Unit]
Description=Mr. Mobile Webhook Server
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/opt/mr-mobile
ExecStart=/usr/bin/node /opt/mr-mobile/webhook-server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mr-mobile-webhook
sudo systemctl start mr-mobile-webhook
sudo systemctl status mr-mobile-webhook
```

### Step 4: Configure GitHub Webhook

Go to GitHub:
1. Repository → **Settings** → **Webhooks** → **Add webhook**
2. **Payload URL**: `http://YOUR_SERVER_IP:7777/webhook`
3. **Content type**: `application/json`
4. **Secret**: Same as in `webhook-server.js`
5. **Events**: Select "Just the push event"
6. Click **Add webhook**

### Step 5: Test Webhook

```bash
# Make a change
echo "# Webhook test" >> README.md
git add README.md
git commit -m "Test webhook deployment"
git push origin main
```

Check webhook delivery on GitHub:
- Go to Webhooks → Recent Deliveries
- Should show successful delivery (green checkmark)

---

## 📝 Method 3: Manual Deploy Script

For manual deployments or rollbacks.

### Usage

```bash
# SSH to production server
ssh your-username@your-server.com

# Navigate to app directory
cd /opt/mr-mobile

# Run deployment script
sudo bash scripts/deploy-production.sh
```

### What the Script Does

1. ✅ Pulls latest code from GitHub
2. ✅ Pulls latest Docker image
3. ✅ Creates backup of current deployment
4. ✅ Stops old containers
5. ✅ Starts new containers
6. ✅ Performs health check
7. ✅ Cleans up old images
8. ✅ Auto-rollback if health check fails

### Customize the Script

Edit `scripts/deploy-production.sh`:

```bash
nano scripts/deploy-production.sh
```

Update these variables:

```bash
APP_DIR="/opt/mr-mobile"  # Your app directory
DOCKER_IMAGE="ghcr.io/YOUR_USERNAME/mr-mobile:latest"  # Your image
CONTAINER_NAME="mr-mobile-app"  # Your container name
```

---

## 🔄 Rollback & Emergency Procedures

### Quick Rollback to Previous Version

```bash
# SSH to server
ssh your-username@your-server.com
cd /opt/mr-mobile

# List available backups
docker images | grep backup

# Rollback to specific backup
docker tag mr-mobile-app_backup_20250603_143000 ghcr.io/YOUR_USERNAME/mr-mobile:latest

# Restart containers
docker-compose down
docker-compose up -d

# Verify
curl http://localhost:3000/api/health
```

### Rollback to Specific Git Commit

```bash
# On server
cd /opt/mr-mobile

# Find commit hash
git log --oneline -n 10

# Checkout specific commit
git checkout COMMIT_HASH

# Pull Docker image for that commit
docker pull ghcr.io/YOUR_USERNAME/mr-mobile:main-COMMIT_HASH

# Update docker-compose.yml temporarily
nano docker-compose.yml
# Change image to: ghcr.io/YOUR_USERNAME/mr-mobile:main-COMMIT_HASH

# Restart
docker-compose up -d
```

### Emergency Stop

```bash
# Stop all containers immediately
docker-compose down

# Or force stop
docker stop mr-mobile-app mr-mobile-db mr-mobile-redis

# View logs to diagnose
docker-compose logs --tail=100
```

---

## 📊 Monitoring & Logs

### View Real-Time Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app
```

### Health Monitoring Script

Create `/opt/mr-mobile/scripts/health-check.sh`:

```bash
#!/bin/bash

HEALTH_URL="http://localhost:3000/api/health"
ALERT_EMAIL="admin@yourdomain.com"

if ! curl -f "$HEALTH_URL" > /dev/null 2>&1; then
    echo "⚠️ Health check failed at $(date)" | mail -s "Mr. Mobile DOWN" "$ALERT_EMAIL"
    
    # Auto-restart
    cd /opt/mr-mobile
    docker-compose restart app
fi
```

Add to crontab:

```bash
# Check health every 5 minutes
crontab -e

# Add this line:
*/5 * * * * /opt/mr-mobile/scripts/health-check.sh
```

### Container Resource Usage

```bash
# Real-time stats
docker stats

# Disk usage
docker system df

# Clean up (careful!)
docker system prune -a
```

---

## 🎯 Complete Workflow Example

Here's how your complete deployment workflow looks:

### Daily Development

```bash
# On your local machine

# 1. Make changes to code
code src/components/SomeComponent.tsx

# 2. Test locally
npm run dev

# 3. Commit changes
git add .
git commit -m "Add new feature"

# 4. Push to GitHub
git push origin main

# 5. That's it! GitHub Actions will:
#    - Run tests
#    - Build Docker image
#    - Push to GHCR
#    - Deploy to production automatically

# 6. Verify deployment (2-3 minutes later)
curl https://your-domain.com/api/health
```

### Zero-Downtime Deployment

To achieve zero-downtime, use blue-green deployment:

Update `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app-blue:
    image: ghcr.io/YOUR_USERNAME/mr-mobile:latest
    container_name: mr-mobile-app-blue
    environment:
      - VIRTUAL_HOST=mrmobile.com
    # ... rest of config

  app-green:
    image: ghcr.io/YOUR_USERNAME/mr-mobile:previous
    container_name: mr-mobile-app-green
    environment:
      - VIRTUAL_HOST=mrmobile.com
    # ... rest of config

  nginx-proxy:
    image: jwilder/nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
```

---

## ✅ Summary

You now have **3 deployment methods**:

| Method | Auto-Deploy | Setup Time | Best For |
|--------|-------------|------------|----------|
| **GitHub Actions** | ✅ Yes | 15 min | Recommended for most users |
| **Webhook** | ✅ Yes | 30 min | Instant deployments |
| **Manual Script** | ❌ No | 5 min | Emergency or testing |

### Recommended Setup

For production, use **GitHub Actions** (Method 1):
- ✅ Fully automated
- ✅ Integrated with CI/CD
- ✅ Secure (SSH key-based)
- ✅ Detailed logs
- ✅ Auto-rollback on failure

### Quick Command Reference

```bash
# Deploy manually
sudo bash /opt/mr-mobile/scripts/deploy-production.sh

# View logs
docker-compose logs -f

# Restart app
docker-compose restart app

# Full restart
docker-compose down && docker-compose up -d

# Health check
curl http://localhost:3000/api/health

# Rollback
docker tag mr-mobile-app_backup_TIMESTAMP ghcr.io/YOUR_USERNAME/mr-mobile:latest
docker-compose up -d
```

---

## 🚀 Next Steps

1. **Set up Method 1** (GitHub Actions) - Takes 15 minutes
2. **Test deployment** - Push a small change
3. **Configure monitoring** - Set up health checks
4. **Add domain & SSL** - Use Nginx + Let's Encrypt
5. **Set up backups** - Automated database backups

---

**Your app is now production-ready with automatic deployments! 🎉**

Every time you push to GitHub, your production app updates automatically within 3-5 minutes!
