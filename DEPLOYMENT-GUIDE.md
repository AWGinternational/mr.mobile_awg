# Deployment Documentation

## 📦 Pre-Deployment Checklist

This guide will help you deploy the Mr. Mobile application to production.

---

## 🔧 Prerequisites

Before deploying, ensure you have:

- [ ] GitHub account (for code hosting)
- [ ] GitHub Student Developer Pack activated
- [ ] DigitalOcean account with $200 credit
- [ ] All third-party services configured:
  - [ ] Neon/PostgreSQL database
  - [ ] Upstash Redis
  - [ ] Cloudinary (image storage)
  - [ ] Resend (email service)
  - [ ] EasyPaisa/JazzCash merchant accounts (optional)

---

## 📋 Deployment Options

### Option 1: DigitalOcean App Platform (Recommended - Easiest)
- **Cost**: $20/month ($5 app + $15 database)
- **Setup Time**: 15 minutes
- **Complexity**: Low
- **Auto-deploy**: Yes (on git push)
- **FREE Duration**: 10 months with $200 credit

### Option 2: DigitalOcean Droplet (Most Economical)
- **Cost**: $6/month
- **Setup Time**: 1-2 hours
- **Complexity**: Medium
- **Auto-deploy**: Manual or with CI/CD
- **FREE Duration**: 33 months with $200 credit

### Option 3: Docker Deployment (Any Platform)
- **Cost**: Varies by provider
- **Setup Time**: 30 minutes
- **Complexity**: Medium
- **Portability**: High (works anywhere)

---

## 🚀 Quick Start: Push to GitHub

### Step 1: Initialize Git Repository

```bash
cd /Users/apple/Documents/mr.mobile

# Initialize git if not already done
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Mr. Mobile Management System

Features:
- Multi-level authentication (Super Admin, Shop Owner, Worker)
- POS system with cart management
- Inventory management
- Supplier management
- Product catalog
- Sales tracking
- Messages system
- Daily closing
- Mobile responsive design
- Dark mode support
"
```

### Step 2: Create GitHub Repository

```bash
# Create new repository on GitHub
# Go to: https://github.com/new
# Repository name: mr.mobile
# Description: Mobile Shop Management System for Pakistan
# Visibility: Private (recommended) or Public
# DON'T initialize with README (you already have one)

# Link local repo to GitHub
git remote add origin https://github.com/YOUR_USERNAME/mr.mobile.git

# Push code
git branch -M main
git push -u origin main
```

### Step 3: Update Configuration Files

Before pushing, update these files with your GitHub username:

**File: `.do/app.yaml`**
```yaml
# Line 8: Update with your GitHub username
repo: YOUR_GITHUB_USERNAME/mr.mobile
```

---

## 🐳 Docker Deployment

### Build and Test Locally

```bash
# Build Docker image
docker build -t mr-mobile:latest .

# Run with Docker Compose (includes database)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop containers
docker-compose down
```

### Deploy to Any Cloud Provider

The Docker image can be deployed to:
- DigitalOcean Container Registry
- AWS ECR + ECS
- Azure Container Registry + App Service
- Google Cloud Run
- Any Kubernetes cluster

---

## ☁️ DigitalOcean App Platform Deployment

### Prerequisites

```bash
# Install DigitalOcean CLI
brew install doctl

# Authenticate
doctl auth init
# Paste your API token from: https://cloud.digitalocean.com/account/api/tokens
```

### Deploy Application

```bash
# Method 1: Using CLI
doctl apps create --spec .do/app.yaml

# Method 2: Using Dashboard
# 1. Go to: https://cloud.digitalocean.com/apps
# 2. Click "Create App"
# 3. Connect GitHub repository
# 4. Select "mr.mobile" repository
# 5. DigitalOcean auto-detects Next.js
# 6. Add environment variables (see below)
# 7. Click "Launch App"
```

### Environment Variables to Add in Dashboard

Go to App → Settings → Environment Variables:

```
DATABASE_URL = ${db.DATABASE_URL}  # Auto-populated
NEXTAUTH_URL = ${APP_URL}          # Auto-populated
NEXTAUTH_SECRET = <generate-with-openssl>
UPSTASH_REDIS_REST_URL = <from-upstash>
UPSTASH_REDIS_REST_TOKEN = <from-upstash>
CLOUDINARY_CLOUD_NAME = <from-cloudinary>
CLOUDINARY_API_KEY = <from-cloudinary>
CLOUDINARY_API_SECRET = <from-cloudinary>
RESEND_API_KEY = <from-resend>
FROM_EMAIL = noreply@yourdomain.com
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 64
```

---

## 🖥️ DigitalOcean Droplet Deployment

See detailed guide in: `DIGITALOCEAN-DROPLET-GUIDE.md`

Quick overview:
1. Create Ubuntu 22.04 droplet ($6/month)
2. SSH into server
3. Install Node.js, PostgreSQL, Nginx
4. Clone repository
5. Setup environment
6. Build application
7. Configure PM2 process manager
8. Setup Nginx reverse proxy
9. Install SSL certificate
10. Configure automatic backups

---

## 📊 Cost Estimation

### Monthly Costs (After Free Credits)

| Service | Cost | Required |
|---------|------|----------|
| DigitalOcean App Platform | $20/month | ✅ Yes |
| DigitalOcean Droplet | $6/month | Alternative |
| Upstash Redis | $0 (free tier) | ✅ Yes |
| Cloudinary | $0 (free tier) | ✅ Yes |
| Resend | $0 (free tier) | ✅ Yes |
| Domain (.me) | $0 first year | Optional |
| **Total (App Platform)** | **$20/month** | - |
| **Total (Droplet)** | **$6/month** | - |

### Free Credit Duration

- **$200 DigitalOcean credit**: 
  - App Platform: 10 months FREE
  - Droplet: 33 months FREE

---

## 🔒 Security Checklist

Before deploying:

- [ ] All environment variables use secrets (not hardcoded)
- [ ] `.env` files are in `.gitignore` (✅ already done)
- [ ] NEXTAUTH_SECRET is strong (64+ characters)
- [ ] Database password is strong
- [ ] SSL/HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is working
- [ ] SQL injection protection (Prisma ✅)
- [ ] XSS protection enabled

---

## 📈 Post-Deployment Tasks

### Immediate (Day 1)

- [ ] Test all user roles (Super Admin, Owner, Worker)
- [ ] Test POS system end-to-end
- [ ] Test payment processing
- [ ] Verify database backups working
- [ ] Setup monitoring alerts
- [ ] Test mobile responsiveness

### Week 1

- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Setup automated backups
- [ ] Document deployment process
- [ ] Train shop owners/workers

### Month 1

- [ ] Review usage statistics
- [ ] Optimize database queries
- [ ] Setup auto-scaling (if needed)
- [ ] Implement feature requests
- [ ] Review security logs
- [ ] Update documentation

---

## 🆘 Troubleshooting

### Build Fails

```bash
# Check Node.js version
node --version  # Should be 20.x

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Error

```bash
# Test connection string
DATABASE_URL="your-url" npx prisma db push

# Check if database is accessible
psql "$DATABASE_URL"
```

### Application Won't Start

```bash
# Check logs
docker-compose logs app
# or
pm2 logs mr-mobile

# Check port is not in use
lsof -i :3000
```

---

## 📞 Support Resources

- **Documentation**: See `/docs` folder
- **GitHub Issues**: Report bugs and feature requests
- **Student Pack**: https://education.github.com/pack
- **DigitalOcean Docs**: https://docs.digitalocean.com
- **Next.js Docs**: https://nextjs.org/docs

---

## 🎯 Next Steps

After reading this guide:

1. **Choose deployment method** (App Platform recommended)
2. **Setup external services** (Upstash, Cloudinary, Resend)
3. **Push code to GitHub**
4. **Deploy to DigitalOcean**
5. **Configure custom domain** (optional)
6. **Setup monitoring**
7. **Train users**
8. **Launch! 🚀**

---

## 📝 Notes

- This is a **production-ready** application
- All security best practices are implemented
- Code follows Next.js 14+ patterns
- Database uses Prisma ORM (type-safe)
- Authentication uses NextAuth.js
- Multi-tenancy is built-in
- Mobile-responsive design
- Dark mode support
- Pakistani market optimized (PKR, local payments)

**Good luck with your deployment! 🎉**
