# 🚀 GitHub Setup & Container Registry Guide

This guide will walk you through setting up GitHub Container Registry (GHCR), pushing your code, and configuring automated CI/CD.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Repository Setup](#github-repository-setup)
3. [GitHub Container Registry Setup](#github-container-registry-setup)
4. [Environment Variables Configuration](#environment-variables-configuration)
5. [Push Code to GitHub](#push-code-to-github)
6. [Verify CI/CD Pipeline](#verify-cicd-pipeline)
7. [Pull and Use Docker Images](#pull-and-use-docker-images)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Accounts
- ✅ GitHub account (free tier works)
- ✅ Git installed locally
- ✅ Docker Desktop installed
- ✅ Terminal access (macOS Terminal, zsh)

### Verify Installation
```bash
# Check Git version
git --version

# Check Docker version
docker --version

# Check if logged into GitHub
gh auth status  # Optional: GitHub CLI
```

---

## 📦 GitHub Repository Setup

### Step 1: Create New Repository

1. **Go to GitHub**: https://github.com/new
2. **Repository details**:
   - **Name**: `mr-mobile` (or your preferred name)
   - **Description**: "Mobile Shop Management System - Multi-tenant POS system for Pakistan retail shops"
   - **Visibility**: 
     - `Private` (recommended for business applications)
     - `Public` (if you want to showcase your work)
   - **Initialize**: ❌ Do NOT initialize with README (we already have code)

3. **Click**: "Create repository"

### Step 2: Note Your Repository URL

After creating, you'll see:
```bash
# HTTPS URL (recommended)
https://github.com/YOUR_USERNAME/mr-mobile.git

# SSH URL (if you have SSH keys configured)
git@github.com:YOUR_USERNAME/mr-mobile.git
```

**Save this URL** - you'll need it in Step 5.

---

## 🐳 GitHub Container Registry Setup

### What is GHCR?

GitHub Container Registry (GHCR) is Docker Hub alternative that's:
- ✅ **FREE** for public repositories
- ✅ **FREE** for private repositories (with 500MB storage + 1GB bandwidth/month)
- ✅ **Integrated** with GitHub Actions (no external service needed)
- ✅ **Secure** with GitHub authentication
- ✅ **Fast** CI/CD integration

### Step 1: Enable Container Registry

GHCR is **automatically available** for all GitHub users. No setup needed!

### Step 2: Configure Package Visibility

After your first Docker push (we'll do this later), you need to set package visibility:

1. Go to your GitHub profile: `https://github.com/YOUR_USERNAME?tab=packages`
2. Find package: `mr-mobile` (appears after first push)
3. Click on package name
4. Go to **"Package settings"** (right sidebar)
5. Scroll to **"Danger Zone"**
6. Set visibility:
   - **Private**: Only you can pull (recommended for production)
   - **Public**: Anyone can pull (good for open source)

### Step 3: Understanding GHCR URLs

Your Docker images will be at:
```
ghcr.io/YOUR_USERNAME/mr-mobile:latest
ghcr.io/YOUR_USERNAME/mr-mobile:main
ghcr.io/YOUR_USERNAME/mr-mobile:develop
ghcr.io/YOUR_USERNAME/mr-mobile:v1.0.0
```

Example:
```bash
# If your GitHub username is "john-doe"
ghcr.io/john-doe/mr-mobile:latest

# CI/CD automatically pushes with multiple tags:
# - Branch name (main, develop)
# - Git commit SHA (main-abc1234)
# - Semantic version (v1.0.0, 1.0, 1)
# - "latest" for main branch
```

---

## 🔐 Environment Variables Configuration

### Step 1: GitHub Secrets Setup

GitHub Actions needs secrets to work properly.

1. Go to: `https://github.com/YOUR_USERNAME/mr-mobile/settings/secrets/actions`
2. Click: **"New repository secret"**

### Required Secrets

**Note**: For GHCR, you **DON'T** need to add `GITHUB_TOKEN` manually - it's automatically provided by GitHub Actions!

However, you'll need these for your **application**:

#### 1. Database URL (Neon PostgreSQL)
```
Name: DATABASE_URL
Value: postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

#### 2. NextAuth Secret
```bash
# Generate a random secret
openssl rand -base64 32

# Add to GitHub Secrets:
Name: NEXTAUTH_SECRET
Value: <paste generated secret>
```

#### 3. NextAuth URL
```
Name: NEXTAUTH_URL
Value: https://your-domain.com (or DigitalOcean app URL)
```

#### 4. Redis URL (Upstash)
```
Name: REDIS_URL
Value: redis://:PASSWORD@HOST:PORT
```

#### 5. Cloudinary Credentials
```
Name: CLOUDINARY_CLOUD_NAME
Value: your_cloud_name

Name: CLOUDINARY_API_KEY
Value: your_api_key

Name: CLOUDINARY_API_SECRET
Value: your_api_secret
```

#### 6. Resend API Key
```
Name: RESEND_API_KEY
Value: re_xxxxxxxxxxxxxxxxxxxx
```

### Step 2: Environment Variables Template

We already have `.env.example` in the project. Copy it:

```bash
# Create local .env file
cp .env.example .env

# Edit with your local development values
nano .env  # or use VS Code: code .env
```

**⚠️ IMPORTANT**: Never commit `.env` to GitHub! It's already in `.gitignore`.

---

## 🚀 Push Code to GitHub

### Option A: Automated Script (Recommended)

We have a helper script that does everything:

```bash
# Make script executable
chmod +x scripts/push-to-github.sh

# Run the script
./scripts/push-to-github.sh
```

**The script will prompt you for**:
1. GitHub repository URL
2. Confirmation to proceed

**What it does**:
- ✅ Initializes Git repository
- ✅ Adds all files (respecting .gitignore)
- ✅ Creates initial commit
- ✅ Adds GitHub remote
- ✅ Pushes to main branch
- ✅ Validates environment files

### Option B: Manual Push

If you prefer manual control:

```bash
# Step 1: Initialize Git (if not already done)
git init

# Step 2: Add all files
git add .

# Step 3: Create initial commit
git commit -m "Initial commit: Mr. Mobile Shop Management System

- Complete Next.js 14 full-stack application
- Multi-tenant shop management
- POS system with payment integrations
- Inventory, suppliers, sales management
- Docker containerization ready
- CI/CD pipeline configured"

# Step 4: Add GitHub remote (replace with YOUR URL)
git remote add origin https://github.com/YOUR_USERNAME/mr-mobile.git

# Step 5: Push to GitHub
git push -u origin main
```

### Step 4: Verify Push

1. Go to: `https://github.com/YOUR_USERNAME/mr-mobile`
2. You should see all your files
3. Check **"Actions"** tab - CI/CD should start automatically!

---

## ✅ Verify CI/CD Pipeline

### Step 1: Check GitHub Actions

1. Go to: `https://github.com/YOUR_USERNAME/mr-mobile/actions`
2. You should see: "🚀 CI/CD Pipeline" running
3. Click on the workflow run to see details

### Pipeline Jobs

The pipeline has **6 jobs** that run:

| Job | What It Does | Duration |
|-----|-------------|----------|
| 🔍 Code Quality | Runs ESLint, TypeScript type-checking | ~2 min |
| 🔒 Security Scan | Checks npm packages, scans for vulnerabilities | ~3 min |
| 🏗️ Build & Test | Builds Next.js app, tests with PostgreSQL | ~4 min |
| 🐳 Docker Build | Builds multi-platform image, pushes to GHCR | ~8 min |
| 📊 Performance Analysis | Analyzes bundle size, performance metrics | ~1 min |
| 📢 Notify & Summary | Generates summary, sends notifications | ~30 sec |

**Total time**: ~15-20 minutes for first run

### Step 2: Monitor Progress

Click on each job to see detailed logs:

```
🔍 Code Quality
  ├── 📥 Checkout code
  ├── 🔧 Setup Node.js
  ├── 📦 Install dependencies
  ├── 🎨 Run ESLint
  └── 📝 TypeScript type check

🐳 Docker Build & Push
  ├── 📥 Checkout code
  ├── 🔧 Set up QEMU
  ├── 🔧 Set up Docker Buildx
  ├── 🔑 Login to GHCR
  ├── 🏷️ Extract metadata
  ├── 🐳 Build and push (AMD64 + ARM64)
  └── 🔍 Scan with Trivy
```

### Step 3: Check Build Artifacts

After successful run:
1. Click on the workflow run
2. Scroll down to **"Artifacts"**
3. You'll see:
   - `build-output` (Next.js compiled files)
   - `lint-results` (ESLint reports)

### Step 4: View GitHub Summary

GitHub Actions creates beautiful summaries:

1. Click on workflow run
2. Look for **"Summary"** section
3. You'll see:
   - 🐳 Docker Build Summary
   - 📊 Bundle Size Analysis
   - 🚀 CI/CD Pipeline Summary

---

## 📦 Pull and Use Docker Images

### Step 1: Login to GHCR

```bash
# Login using your GitHub Personal Access Token
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# OR: Login interactively
docker login ghcr.io
# Username: YOUR_USERNAME
# Password: <paste your GitHub token>
```

**How to get GitHub token**:
1. Go to: https://github.com/settings/tokens
2. Click: "Generate new token (classic)"
3. Select scopes:
   - ✅ `read:packages` (to pull images)
   - ✅ `write:packages` (to push images - already done by CI/CD)
4. Generate and save the token

### Step 2: Pull Your Image

```bash
# Pull latest image
docker pull ghcr.io/YOUR_USERNAME/mr-mobile:latest

# Pull specific tag
docker pull ghcr.io/YOUR_USERNAME/mr-mobile:main
docker pull ghcr.io/YOUR_USERNAME/mr-mobile:v1.0.0

# Pull by commit SHA
docker pull ghcr.io/YOUR_USERNAME/mr-mobile:main-abc1234
```

### Step 3: Run Locally

```bash
# Run the container
docker run -d \
  --name mr-mobile \
  -p 3000:3000 \
  -e DATABASE_URL="your_database_url" \
  -e NEXTAUTH_SECRET="your_secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  ghcr.io/YOUR_USERNAME/mr-mobile:latest

# Check logs
docker logs -f mr-mobile

# Test the app
curl http://localhost:3000/api/health
```

### Step 4: Use in Production (DigitalOcean)

Update your `.do/app.yaml`:

```yaml
services:
  - name: mr-mobile
    image:
      registry_type: GHCR
      registry: YOUR_USERNAME
      repository: mr-mobile
      tag: latest
    # ... rest of config
```

Or use Docker Droplet:

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Pull and run
docker pull ghcr.io/YOUR_USERNAME/mr-mobile:latest
docker run -d -p 80:3000 --env-file .env ghcr.io/YOUR_USERNAME/mr-mobile:latest
```

---

## 🔧 Troubleshooting

### Issue 1: CI/CD Pipeline Fails on Build

**Symptom**: Build job fails with "Cannot find module"

**Solution**:
```bash
# Ensure all dependencies are in package.json
npm install

# Commit package-lock.json
git add package-lock.json
git commit -m "chore: update dependencies"
git push
```

### Issue 2: Docker Build Fails - "GITHUB_TOKEN" Not Found

**Symptom**: Docker job fails with authentication error

**Solution**:
GitHub automatically provides `GITHUB_TOKEN` - **NO MANUAL SETUP NEEDED**. 

Check permissions in `.github/workflows/ci-cd.yml`:
```yaml
jobs:
  docker:
    permissions:
      contents: read
      packages: write  # ← This must be present
```

### Issue 3: Can't Pull Docker Image - "unauthorized"

**Symptom**: `docker pull` fails with 401 Unauthorized

**Solution**:
```bash
# 1. Create GitHub Personal Access Token
# Go to: https://github.com/settings/tokens

# 2. Login to GHCR
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 3. Verify login
docker info | grep -i registry
```

### Issue 4: Package Not Showing in GHCR

**Symptom**: After successful pipeline, no package appears

**Solution**:
1. Wait 2-3 minutes (initial indexing takes time)
2. Check: `https://github.com/YOUR_USERNAME?tab=packages`
3. If still missing, re-run the workflow:
   ```bash
   # Go to Actions tab → Re-run workflow
   ```

### Issue 5: Multi-Platform Build Takes Too Long

**Symptom**: Docker build takes >15 minutes

**Solution**:
For faster testing, disable ARM64 builds temporarily:

Edit `.github/workflows/ci-cd.yml`:
```yaml
- name: 🐳 Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    platforms: linux/amd64  # Remove linux/arm64 for faster builds
```

Re-enable for production:
```yaml
platforms: linux/amd64,linux/arm64
```

### Issue 6: Environment Variables Not Working

**Symptom**: App crashes with "DATABASE_URL is not defined"

**Solution**:
```bash
# 1. Check GitHub Secrets are set
# Go to: Settings → Secrets → Actions

# 2. Verify secret names match exactly
DATABASE_URL (not database_url or DB_URL)

# 3. For DigitalOcean, add to .do/app.yaml:
envs:
  - key: DATABASE_URL
    scope: RUN_TIME
    value: ${DATABASE_URL}  # References GitHub secret
```

---

## 📊 GitHub Container Registry Benefits

### Why Use GHCR Instead of Docker Hub?

| Feature | GHCR (FREE) | Docker Hub (FREE) |
|---------|-------------|-------------------|
| **Storage** | 500MB | 200MB |
| **Bandwidth** | 1GB/month | 200MB/month |
| **Repositories** | Unlimited | 1 private |
| **CI/CD Integration** | Built-in | Requires credentials |
| **Security Scanning** | GitHub Advanced Security | Limited |
| **Access Control** | GitHub teams/orgs | Basic |
| **Speed** | Fast (same CDN as GitHub) | Moderate |

### GHCR Features You Get

1. **Automated Tagging**:
   ```
   main → latest
   develop → develop
   v1.0.0 → v1.0.0, v1.0, v1, latest
   commit abc123 → main-abc123
   ```

2. **Security Scanning**:
   - Trivy scans on every build
   - GitHub Security alerts
   - Dependabot integration

3. **Multi-Platform**:
   - AMD64 (Intel/AMD servers)
   - ARM64 (Apple Silicon, AWS Graviton)

4. **Caching**:
   - GitHub Actions cache
   - Faster subsequent builds

---

## 🎯 Next Steps

### For Development
1. ✅ Clone and work on feature branches
2. ✅ Open Pull Requests (triggers CI/CD)
3. ✅ Merge to `main` (auto-deploys)

### For Production
1. ✅ Configure external services (Neon, Upstash, Cloudinary)
2. ✅ Deploy to DigitalOcean (see DEPLOYMENT-GUIDE.md)
3. ✅ Setup custom domain
4. ✅ Enable monitoring and alerts

### Recommended Workflow

```bash
# 1. Create feature branch
git checkout -b feature/add-loan-module

# 2. Make changes, commit
git add .
git commit -m "feat: add loan management module"

# 3. Push to GitHub
git push origin feature/add-loan-module

# 4. Open Pull Request
# Go to GitHub → Pull Requests → New PR

# 5. CI/CD runs automatically
# - Code quality checks
# - Security scanning
# - Build and test

# 6. After approval, merge to main
# - Auto-deploys to production (if configured)
```

---

## 📚 Additional Resources

### Documentation
- **GitHub Container Registry**: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- **GitHub Actions**: https://docs.github.com/en/actions
- **Docker Multi-Platform**: https://docs.docker.com/build/building/multi-platform/

### Helpful Commands
```bash
# View all GitHub workflows
gh workflow list

# View workflow runs
gh run list

# View logs for a specific run
gh run view <run-id> --log

# Re-run a failed workflow
gh run rerun <run-id>

# List all Docker images in GHCR
docker search ghcr.io/YOUR_USERNAME

# Delete old Docker images (cleanup)
docker image prune -a
```

---

## ✅ Checklist

Before deploying to production, ensure:

- [ ] GitHub repository created
- [ ] Code pushed successfully
- [ ] CI/CD pipeline runs green
- [ ] Docker image appears in GHCR
- [ ] All GitHub Secrets configured
- [ ] Environment variables set
- [ ] Can pull Docker image locally
- [ ] Health check endpoint works
- [ ] External services configured (Neon, Upstash, etc.)
- [ ] Domain name ready (optional)
- [ ] SSL certificate configured (DigitalOcean auto-provides)

---

## 🎉 Congratulations!

You now have:
- ✅ Automated CI/CD pipeline
- ✅ Docker images in GitHub Container Registry
- ✅ Multi-platform builds (AMD64 + ARM64)
- ✅ Security scanning on every commit
- ✅ Professional development workflow

**Ready to deploy?** See `DEPLOYMENT-GUIDE.md` for production deployment instructions!

---

**Questions or Issues?**
- Check the [Troubleshooting](#troubleshooting) section
- Review GitHub Actions logs
- Test locally with `./scripts/test-docker.sh`
