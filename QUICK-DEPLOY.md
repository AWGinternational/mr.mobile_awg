# 🚀 Quick Deployment Guide

This is a simplified guide to get your Mr. Mobile application deployed quickly.

---

## 🎯 Prerequisites

1. ✅ GitHub Student Developer Pack activated
2. ✅ DigitalOcean account with $200 credit
3. ✅ GitHub account

---

## 📦 What's Included

Your project now has:

- ✅ **Docker configuration** (`Dockerfile`, `docker-compose.yml`)
- ✅ **DigitalOcean App Platform config** (`.do/app.yaml`)
- ✅ **CI/CD pipeline** (`.github/workflows/ci-cd.yml`)
- ✅ **Deployment scripts** (`scripts/push-to-github.sh`)
- ✅ **Health check endpoint** (`/api/health`)
- ✅ **Environment template** (`.env.example`)

---

## 🚀 Quick Start (3 Options)

### Option 1: DigitalOcean App Platform (Easiest - 15 min)

**Cost**: $20/month → **FREE for 10 months** with student credit

```bash
# 1. Push to GitHub
./scripts/push-to-github.sh

# 2. Go to DigitalOcean
# https://cloud.digitalocean.com/apps

# 3. Click "Create App" → Connect GitHub → Deploy!
```

**✅ Best for**: Quick deployment, auto-deploy on git push

---

### Option 2: DigitalOcean Droplet (Cheapest - 1-2 hours)

**Cost**: $6/month → **FREE for 33 months** with student credit

See detailed guide: [`DEPLOYMENT-GUIDE.md`](./DEPLOYMENT-GUIDE.md)

**✅ Best for**: Learning DevOps, lowest long-term cost

---

### Option 3: Docker (Test Locally First - 5 min)

```bash
# Test Docker deployment locally
./scripts/test-docker.sh

# Or manually:
docker-compose up -d
```

**✅ Best for**: Testing before production deployment

---

## 📋 Step-by-Step: Push to GitHub

### 1. Make Script Executable

```bash
chmod +x scripts/push-to-github.sh
```

### 2. Run Push Script

```bash
./scripts/push-to-github.sh
```

This script will:
- ✅ Check for sensitive files
- ✅ Initialize git repository
- ✅ Ask for your GitHub username
- ✅ Update configuration files
- ✅ Commit changes
- ✅ Push to GitHub

### 3. Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `mr.mobile`
3. Description: Mobile Shop Management System
4. Visibility: **Private** (recommended)
5. DON'T initialize with README
6. Click "Create repository"

---

## 🔧 Setup External Services (One-time)

### 1. Neon Database (FREE)

```bash
# 1. Visit: https://neon.tech
# 2. Sign up with GitHub
# 3. Create project in Singapore region
# 4. Copy DATABASE_URL
```

### 2. Upstash Redis (FREE)

```bash
# 1. Visit: https://upstash.com
# 2. Create database in Singapore
# 3. Copy UPSTASH_REDIS_REST_URL and TOKEN
```

### 3. Cloudinary (FREE)

```bash
# 1. Visit: https://cloudinary.com
# 2. Sign up
# 3. Copy CLOUD_NAME, API_KEY, API_SECRET
```

### 4. Resend Email (FREE)

```bash
# 1. Visit: https://resend.com
# 2. Create API key
# 3. Copy RESEND_API_KEY
```

---

## 🌐 Deploy to DigitalOcean App Platform

### Method 1: Using Dashboard (Recommended)

1. **Go to App Platform**
   - Visit: https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Connect GitHub**
   - Select "GitHub"
   - Authorize DigitalOcean
   - Choose `mr.mobile` repository
   - Branch: `main`

3. **Configure Resources**
   - DigitalOcean auto-detects Next.js ✅
   - Database: Select "PostgreSQL 15" ($15/month)
   - App: Basic plan ($5/month)

4. **Add Environment Variables**
   - Go to "Environment Variables" section
   - Add these variables:

   ```
   DATABASE_URL = ${db.DATABASE_URL}  (auto)
   NEXTAUTH_URL = ${APP_URL}          (auto)
   NEXTAUTH_SECRET = <generate-below>
   UPSTASH_REDIS_REST_URL = <from-upstash>
   UPSTASH_REDIS_REST_TOKEN = <from-upstash>
   CLOUDINARY_CLOUD_NAME = <from-cloudinary>
   CLOUDINARY_API_KEY = <from-cloudinary>
   CLOUDINARY_API_SECRET = <from-cloudinary>
   RESEND_API_KEY = <from-resend>
   FROM_EMAIL = noreply@yourdomain.com
   ```

   Generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 64
   ```

5. **Deploy!**
   - Click "Launch App"
   - Wait 5-10 minutes
   - Your app is live! 🎉

### Method 2: Using CLI

```bash
# Install DigitalOcean CLI
brew install doctl

# Authenticate
doctl auth init

# Deploy
doctl apps create --spec .do/app.yaml
```

---

## 🧪 Test Docker Locally (Optional)

Before deploying to production, test with Docker:

```bash
# Make script executable
chmod +x scripts/test-docker.sh

# Run test
./scripts/test-docker.sh
```

This will:
- ✅ Build Docker image
- ✅ Start PostgreSQL, Redis, and your app
- ✅ Run health checks
- ✅ Setup database
- ✅ Show logs

Access locally at: http://localhost:3000

---

## 📊 Cost Summary

### With GitHub Student Pack ($200 credit)

| Option | Monthly Cost | FREE Duration | Total First Year |
|--------|--------------|---------------|------------------|
| **App Platform** | $20 | 10 months | $40 (2 months paid) |
| **Droplet** | $6 | 33 months | $0 |
| **Docker (Any Cloud)** | Varies | - | - |

### External Services (All FREE Forever)

| Service | Free Tier | Your Usage |
|---------|-----------|------------|
| Upstash Redis | 10K commands/day | ✅ Sufficient |
| Cloudinary | 25GB/month | ✅ Sufficient |
| Resend | 3,000 emails/month | ✅ Sufficient |

---

## 🎯 Recommended Path

### For Quick Deployment (Today):
1. ✅ Run `./scripts/push-to-github.sh`
2. ✅ Setup external services (30 min)
3. ✅ Deploy to App Platform (15 min)
4. ✅ Test application (10 min)

**Total Time**: ~1 hour

### For Learning & Cost Savings:
1. ✅ Test Docker locally first
2. ✅ Push to GitHub
3. ✅ Deploy to Droplet (see `DEPLOYMENT-GUIDE.md`)
4. ✅ Setup monitoring

**Total Time**: ~2-3 hours

---

## ✅ Post-Deployment Checklist

After deployment:

- [ ] Test login with all user roles
- [ ] Test POS system
- [ ] Test inventory management
- [ ] Verify database backups
- [ ] Setup custom domain (optional)
- [ ] Configure monitoring alerts
- [ ] Train users

---

## 🆘 Troubleshooting

### "Docker not found"
```bash
# Install Docker Desktop
# https://www.docker.com/products/docker-desktop
```

### "Git not found"
```bash
# macOS
brew install git
```

### "Build fails"
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### "Database connection error"
```bash
# Check DATABASE_URL in environment variables
# Verify database is running
```

---

## 📖 More Resources

- **Full Deployment Guide**: [`DEPLOYMENT-GUIDE.md`](./DEPLOYMENT-GUIDE.md)
- **Project Documentation**: See all `*.md` files in root
- **GitHub Student Pack**: https://education.github.com/pack
- **DigitalOcean Docs**: https://docs.digitalocean.com
- **Docker Docs**: https://docs.docker.com

---

## 🎉 Ready to Deploy?

Choose your path:

1. **Quick & Easy**: DigitalOcean App Platform (15 min)
2. **Learn & Save**: DigitalOcean Droplet (2 hours)
3. **Test First**: Docker locally (5 min)

Run this to get started:

```bash
chmod +x scripts/push-to-github.sh
./scripts/push-to-github.sh
```

Good luck! 🚀
