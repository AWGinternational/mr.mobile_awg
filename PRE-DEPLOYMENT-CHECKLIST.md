# ✅ Pre-Deployment Checklist

This comprehensive checklist ensures everything is ready before deploying to production.

---

## 📊 Quick Status Overview

| Phase | Status | Time Required | Priority |
|-------|--------|---------------|----------|
| 🐳 Docker Setup | ⏳ Pending | 10 min | 🔴 Critical |
| 🔧 GitHub Setup | ⏳ Pending | 15 min | 🔴 Critical |
| 🌐 External Services | ⏳ Pending | 30 min | 🔴 Critical |
| 🧪 Local Testing | ⏳ Pending | 20 min | 🟡 High |
| 🚀 CI/CD Verification | ⏳ Pending | 15 min | 🟡 High |
| ☁️ Production Deployment | ⏳ Pending | 30 min | 🟢 Ready to deploy |

---

## 📝 Phase 1: Docker Containerization

### 1.1 Verify Docker Installation

```bash
# Check Docker is installed
docker --version
# Expected: Docker version 24.0.0 or higher

# Check Docker is running
docker ps
# Expected: No errors

# Check Docker Compose
docker-compose --version
# Expected: Docker Compose version 2.0.0 or higher
```

**Status**: [ ] Complete

### 1.2 Review Dockerfile

Check that `Dockerfile` exists with:
- [ ] Multi-stage build (deps → builder → runner)
- [ ] Non-root user (nodejs:nextjs)
- [ ] Health check configured
- [ ] Standalone Next.js output
- [ ] Security hardening (dumb-init)

**Location**: `/Users/apple/Documents/mr.mobile/Dockerfile`

**Status**: [ ] Complete

### 1.3 Test Docker Build

```bash
# Build Docker image locally
docker build -t mr-mobile:test .

# Expected output:
# ✅ Successfully built
# ✅ Image size: ~150-200MB

# Verify image exists
docker images | grep mr-mobile
```

**Status**: [ ] Complete

### 1.4 Test Docker Run

```bash
# Create test .env file
cp .env.example .env.docker

# Edit with test credentials
nano .env.docker

# Run container
docker run -d \
  --name mr-mobile-test \
  -p 3000:3000 \
  --env-file .env.docker \
  mr-mobile:test

# Check logs
docker logs -f mr-mobile-test

# Expected: "Server listening on port 3000"
```

**Status**: [ ] Complete

### 1.5 Test Health Check

```bash
# Wait 30 seconds for startup
sleep 30

# Test health endpoint
curl http://localhost:3000/api/health

# Expected output:
# {
#   "status": "healthy",
#   "timestamp": "2025-01-XX...",
#   "uptime": 30,
#   "database": "connected"
# }
```

**Status**: [ ] Complete

### 1.6 Cleanup Test Container

```bash
# Stop and remove test container
docker stop mr-mobile-test
docker rm mr-mobile-test

# Remove test image (optional)
docker rmi mr-mobile:test
```

**Status**: [ ] Complete

---

## 🔧 Phase 2: GitHub Repository Setup

### 2.1 Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `mr-mobile`
3. Visibility: Private (recommended)
4. **DO NOT** initialize with README
5. Click "Create repository"

**Repository URL**: `https://github.com/YOUR_USERNAME/mr-mobile.git`

**Status**: [ ] Complete

### 2.2 Initialize Git Repository

```bash
# Check if Git is initialized
git status

# If not initialized:
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Mr. Mobile Shop Management System

- Complete Next.js 14 full-stack application
- Multi-tenant shop management
- POS system with payment integrations
- Docker containerization ready
- CI/CD pipeline configured"
```

**Status**: [ ] Complete

### 2.3 Connect to GitHub

```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/mr-mobile.git

# Verify remote
git remote -v

# Expected output:
# origin  https://github.com/YOUR_USERNAME/mr-mobile.git (fetch)
# origin  https://github.com/YOUR_USERNAME/mr-mobile.git (push)
```

**Status**: [ ] Complete

### 2.4 Push to GitHub

```bash
# Push to main branch
git push -u origin main

# Expected: All files pushed successfully
```

**Alternative**: Use automated script
```bash
chmod +x scripts/push-to-github.sh
./scripts/push-to-github.sh
```

**Status**: [ ] Complete

### 2.5 Verify Push

1. Go to: `https://github.com/YOUR_USERNAME/mr-mobile`
2. Check files are visible
3. Verify `.env` is NOT pushed (should be in `.gitignore`)

**Status**: [ ] Complete

---

## 🌐 Phase 3: External Services Setup

### 3.1 Neon PostgreSQL

#### Setup Steps:
1. Go to: https://neon.tech
2. Sign up with GitHub
3. Create project: `mr-mobile-production`
4. Select region: AWS us-east-1
5. Copy connection string

#### Add to .env:
```bash
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

#### Test Connection:
```bash
npx prisma db push
npx prisma studio
```

**Status**: [ ] Complete

### 3.2 Upstash Redis

#### Setup Steps:
1. Go to: https://upstash.com
2. Sign up with GitHub
3. Create database: `mr-mobile-cache`
4. Type: Regional
5. Region: AWS us-east-1
6. Copy REST API credentials

#### Add to .env:
```bash
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXXXAbQN..."
```

#### Test Connection:
```bash
# Create test file: scripts/test-redis.js
node scripts/test-redis.js
```

**Status**: [ ] Complete

### 3.3 Cloudinary

#### Setup Steps:
1. Go to: https://cloudinary.com/users/register/free
2. Create cloud name: `mrmobile`
3. Verify email
4. Copy credentials from dashboard

#### Add to .env:
```bash
CLOUDINARY_CLOUD_NAME="mrmobile"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="AbCdEfGh..."
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="mrmobile"
```

#### Test Upload:
```bash
# Upload test image via API
curl -X POST http://localhost:3000/api/upload
```

**Status**: [ ] Complete

### 3.4 Resend Email

#### Setup Steps:
1. Go to: https://resend.com/signup
2. Verify email
3. Create API key: "Mr. Mobile Production"
4. Copy API key (starts with `re_`)

#### Add to .env:
```bash
RESEND_API_KEY="re_123456789_AbCdEfGh..."
```

#### Test Email:
```bash
# Send test email via API
curl -X POST http://localhost:3000/api/send-test-email
```

**Status**: [ ] Complete

---

## 🔐 Phase 4: GitHub Secrets Configuration

### 4.1 Navigate to Secrets

1. Go to: `https://github.com/YOUR_USERNAME/mr-mobile/settings/secrets/actions`
2. Click "New repository secret"

### 4.2 Add Required Secrets

| Secret Name | Value | Status |
|-------------|-------|--------|
| `DATABASE_URL` | Neon connection string | [ ] |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` | [ ] |
| `NEXTAUTH_URL` | Production URL | [ ] |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL | [ ] |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash token | [ ] |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary name | [ ] |
| `CLOUDINARY_API_KEY` | Cloudinary key | [ ] |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | [ ] |
| `RESEND_API_KEY` | Resend key | [ ] |

### 4.3 Verify Secrets

```bash
# Check secrets are set (won't show values)
gh secret list

# Expected: All 9 secrets listed
```

**Status**: [ ] Complete

---

## 🧪 Phase 5: Local Testing

### 5.1 Test with docker-compose

```bash
# Start all services
docker-compose up -d

# Check all containers are running
docker-compose ps

# Expected: 3 containers (postgres, redis, app)
```

**Status**: [ ] Complete

### 5.2 Run Automated Tests

```bash
# Make test script executable
chmod +x scripts/test-docker.sh

# Run comprehensive tests
./scripts/test-docker.sh

# Expected:
# ✅ Docker build successful
# ✅ Containers running
# ✅ Health check passed
# ✅ Database connected
# ✅ Redis connected
```

**Status**: [ ] Complete

### 5.3 Manual Testing Checklist

Test each major feature:

| Feature | Test | Status |
|---------|------|--------|
| Authentication | Login/Register works | [ ] |
| Dashboard | Loads without errors | [ ] |
| POS | Can create sale | [ ] |
| Products | Can add/edit products | [ ] |
| Inventory | Stock updates correctly | [ ] |
| Suppliers | Can manage suppliers | [ ] |
| Reports | Charts display data | [ ] |
| Settings | Can update shop info | [ ] |

**Status**: [ ] Complete

### 5.4 Performance Testing

```bash
# Install Apache Bench (if not installed)
brew install ab  # macOS

# Test concurrent users
ab -n 100 -c 10 http://localhost:3000/

# Expected: 
# - Requests per second: >50
# - Failed requests: 0
```

**Status**: [ ] Complete

### 5.5 Cleanup

```bash
# Stop all containers
docker-compose down

# Remove volumes (optional - deletes data)
docker-compose down -v
```

**Status**: [ ] Complete

---

## 🚀 Phase 6: CI/CD Pipeline Verification

### 6.1 Check Workflow File

Verify `.github/workflows/ci-cd.yml` exists with:
- [ ] 6 jobs configured
- [ ] GitHub Container Registry integration
- [ ] Multi-platform builds (AMD64 + ARM64)
- [ ] Security scanning (Trivy)
- [ ] Performance analysis

**Status**: [ ] Complete

### 6.2 Trigger First Pipeline Run

Pipeline automatically runs on push. Check:

1. Go to: `https://github.com/YOUR_USERNAME/mr-mobile/actions`
2. Look for: "🚀 CI/CD Pipeline"
3. Click on the workflow run

**Status**: [ ] Complete

### 6.3 Monitor Pipeline Execution

Watch each job:

| Job | Expected Duration | Status |
|-----|------------------|--------|
| 🔍 Code Quality | ~2 min | [ ] |
| 🔒 Security Scan | ~3 min | [ ] |
| 🏗️ Build & Test | ~4 min | [ ] |
| 🐳 Docker Build | ~8 min | [ ] |
| 📊 Performance Analysis | ~1 min | [ ] |
| 📢 Notify & Summary | ~30 sec | [ ] |

**Total time**: ~15-20 minutes

**Status**: [ ] Complete

### 6.4 Verify Docker Image in GHCR

1. Go to: `https://github.com/YOUR_USERNAME?tab=packages`
2. Find package: `mr-mobile`
3. Verify tags:
   - `latest`
   - `main`
   - `main-<commit-sha>`

**Status**: [ ] Complete

### 6.5 Test Pull from GHCR

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Pull image
docker pull ghcr.io/YOUR_USERNAME/mr-mobile:latest

# Verify image
docker images | grep mr-mobile
```

**Status**: [ ] Complete

### 6.6 Review Security Scan Results

1. Go to: `https://github.com/YOUR_USERNAME/mr-mobile/security/code-scanning`
2. Check Trivy scan results
3. Address any HIGH or CRITICAL vulnerabilities

**Status**: [ ] Complete

---

## ☁️ Phase 7: Pre-Production Checks

### 7.1 Documentation Review

Verify all documentation is complete:

| Document | Purpose | Status |
|----------|---------|--------|
| `README.md` | Project overview | [ ] |
| `DEPLOYMENT-GUIDE.md` | Deployment instructions | [ ] |
| `GITHUB-SETUP-GUIDE.md` | GitHub/GHCR setup | [ ] |
| `EXTERNAL-SERVICES-GUIDE.md` | Services configuration | [ ] |
| `PRE-DEPLOYMENT-CHECKLIST.md` | This checklist | [ ] |
| `.env.example` | Environment template | [ ] |

**Status**: [ ] Complete

### 7.2 Security Audit

- [ ] All `.env` files in `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] HTTPS enforced in production
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] SQL injection protection (Prisma ORM)
- [ ] XSS protection enabled
- [ ] CSRF tokens configured

**Status**: [ ] Complete

### 7.3 Database Readiness

- [ ] Prisma schema finalized
- [ ] Migrations ready
- [ ] Seed data prepared (optional)
- [ ] Indexes optimized
- [ ] Backup strategy planned

**Status**: [ ] Complete

### 7.4 Monitoring Setup

- [ ] Health check endpoint functional
- [ ] Error logging configured
- [ ] Performance monitoring ready
- [ ] Uptime monitoring planned

**Status**: [ ] Complete

---

## 🎯 Phase 8: Deployment Platform Selection

### 8.1 Choose Deployment Platform

Based on your budget and requirements:

| Platform | Cost | Setup Time | Status |
|----------|------|------------|--------|
| **DigitalOcean App Platform** | $20/month (FREE 10 months with student credit) | 30 min | [ ] Recommended ✅ |
| **DigitalOcean Droplet** | $6/month (FREE 33 months with student credit) | 60 min | [ ] Budget option |
| **Vercel** | $0/month (hobby) | 15 min | [ ] Quick start |

**Chosen platform**: _________________

### 8.2 Platform-Specific Preparation

#### For DigitalOcean App Platform:

- [ ] `.do/app.yaml` configured
- [ ] Environment variables list prepared
- [ ] Domain name ready (optional)
- [ ] Student credit activated

#### For DigitalOcean Droplet:

- [ ] SSH key generated
- [ ] Docker Compose ready
- [ ] Nginx configuration prepared
- [ ] SSL certificate plan (Let's Encrypt)

#### For Vercel:

- [ ] Vercel account created
- [ ] Vercel CLI installed (`npm i -g vercel`)
- [ ] Environment variables prepared

**Status**: [ ] Complete

---

## ✅ Final Pre-Deployment Checklist

### Critical Items (MUST be completed)

- [ ] Docker builds successfully locally
- [ ] All tests pass locally
- [ ] Code pushed to GitHub
- [ ] CI/CD pipeline runs green
- [ ] Docker image in GHCR
- [ ] All external services configured
- [ ] All GitHub secrets set
- [ ] Environment variables documented
- [ ] Health check endpoint works
- [ ] No security vulnerabilities

### Important Items (SHOULD be completed)

- [ ] Documentation reviewed
- [ ] Performance tested
- [ ] Database migrations ready
- [ ] Monitoring configured
- [ ] Backup strategy planned
- [ ] Domain name ready
- [ ] SSL certificate planned

### Optional Items (NICE to have)

- [ ] Custom error pages
- [ ] Email templates designed
- [ ] Admin panel tested
- [ ] Mobile responsiveness verified
- [ ] SEO optimization done
- [ ] Analytics configured

---

## 🚦 Deployment Decision

### All Critical Items Complete?

**YES** → Proceed to deployment! 🚀
- Follow `DEPLOYMENT-GUIDE.md`
- Choose your platform (DigitalOcean/Vercel)
- Deploy with confidence!

**NO** → Complete remaining items first
- Review incomplete sections above
- Fix any failing tests
- Resolve security issues
- Update documentation

---

## 📊 Estimated Time to Deploy

Based on this checklist:

| Phase | Time Required | Your Status |
|-------|---------------|-------------|
| Docker Setup | 10 min | [ ] |
| GitHub Setup | 15 min | [ ] |
| External Services | 30 min | [ ] |
| Local Testing | 20 min | [ ] |
| CI/CD Verification | 15 min | [ ] |
| Pre-Production Checks | 20 min | [ ] |
| Platform Setup | 30 min | [ ] |
| **TOTAL** | **~2.5 hours** | [ ] |

---

## 🆘 Troubleshooting Common Issues

### Issue 1: Docker Build Fails

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t mr-mobile:test .
```

### Issue 2: CI/CD Pipeline Fails

Check GitHub Actions logs:
```bash
# Using GitHub CLI
gh run list
gh run view <run-id> --log
```

### Issue 3: Health Check Fails

```bash
# Check container logs
docker logs mr-mobile-test

# Check database connection
docker exec -it mr-mobile-test npm run prisma:studio
```

### Issue 4: Environment Variables Not Loading

```bash
# Verify .env file
cat .env | grep DATABASE_URL

# Check Docker container env
docker exec -it mr-mobile-test env | grep DATABASE_URL
```

---

## 📞 Support Resources

### Documentation
- **Deployment Guide**: `DEPLOYMENT-GUIDE.md`
- **GitHub Setup**: `GITHUB-SETUP-GUIDE.md`
- **External Services**: `EXTERNAL-SERVICES-GUIDE.md`

### Testing Scripts
- **Docker Test**: `./scripts/test-docker.sh`
- **GitHub Push**: `./scripts/push-to-github.sh`

### External Links
- **DigitalOcean Docs**: https://docs.digitalocean.com/
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Actions**: https://docs.github.com/actions
- **Docker Docs**: https://docs.docker.com/

---

## 🎉 Ready to Deploy?

Once all checkboxes are complete, you're ready for production!

**Next steps:**
1. Review `DEPLOYMENT-GUIDE.md`
2. Choose your deployment platform
3. Follow platform-specific instructions
4. Deploy with confidence! 🚀

**Remember**: 
- Start with staging/test deployment first
- Monitor logs during initial deployment
- Have rollback plan ready
- Celebrate when live! 🎊
