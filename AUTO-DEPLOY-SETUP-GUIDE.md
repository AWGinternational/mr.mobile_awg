# 🚀 Quick Setup: GitHub Actions Auto-Deploy

## ⏱️ Time Required: 15-20 minutes

Follow these steps **exactly** to enable automatic deployment.

---

## ✅ Prerequisites

Before starting, make sure you have:

- [ ] GitHub repository created (`AWGinternational/mr.mobile_awg`)
- [ ] Code pushed to GitHub
- [ ] A production server (DigitalOcean, AWS, etc.)
- [ ] SSH access to your server

**Don't have a server yet?** [Jump to Server Setup](#bonus-setting-up-production-server)

---

## 📝 Step-by-Step Setup

### **STEP 1: Generate SSH Key** (2 minutes)

Open your **terminal** (on your Mac) and run:

```bash
# Generate SSH key for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions@mr-mobile" -f ~/.ssh/github_actions_mr_mobile

# When prompted:
# - Enter passphrase: Just press ENTER (leave empty)
# - Confirm passphrase: Press ENTER again
```

This creates two files:
- `~/.ssh/github_actions_mr_mobile` (private key) - **Keep secret!**
- `~/.ssh/github_actions_mr_mobile.pub` (public key) - Safe to share

---

### **STEP 2: Copy Public Key to Server** (3 minutes)

**Option A: Using ssh-copy-id (Easiest)**

```bash
# Replace with YOUR server details
ssh-copy-id -i ~/.ssh/github_actions_mr_mobile.pub YOUR_USERNAME@YOUR_SERVER_IP

# Example:
# ssh-copy-id -i ~/.ssh/github_actions_mr_mobile.pub root@165.232.123.45
```

**Option B: Manual Copy (If Option A doesn't work)**

```bash
# 1. Display public key
cat ~/.ssh/github_actions_mr_mobile.pub

# 2. Copy the output (it starts with "ssh-ed25519...")

# 3. SSH to your server
ssh YOUR_USERNAME@YOUR_SERVER_IP

# 4. On the server, add the key
mkdir -p ~/.ssh
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

**Test the connection:**

```bash
# Try connecting with the new key
ssh -i ~/.ssh/github_actions_mr_mobile YOUR_USERNAME@YOUR_SERVER_IP

# If it connects without asking for password, SUCCESS! ✅
# Type 'exit' to disconnect
```

---

### **STEP 3: Get Private Key Content** (1 minute)

```bash
# Display private key
cat ~/.ssh/github_actions_mr_mobile

# Copy EVERYTHING including these lines:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... (all the content in between)
# -----END OPENSSH PRIVATE KEY-----
```

**Important:** Copy the ENTIRE content to your clipboard!

---

### **STEP 4: Add Secrets to GitHub** (5 minutes)

#### Go to Your GitHub Repository:
1. Open browser: https://github.com/AWGinternational/mr.mobile_awg
2. Click **Settings** (top right)
3. Click **Secrets and variables** (left sidebar)
4. Click **Actions**
5. Click **New repository secret** button

#### Add These 4 Secrets:

**Secret 1: PRODUCTION_HOST**
- Click **New repository secret**
- Name: `PRODUCTION_HOST`
- Value: Your server IP or domain
  - Example: `165.232.123.45`
  - Or: `mrmobile.yourdomain.com`
- Click **Add secret**

**Secret 2: PRODUCTION_USER**
- Click **New repository secret**
- Name: `PRODUCTION_USER`
- Value: Your SSH username
  - Usually: `root`
  - Or: `ubuntu` (for Ubuntu servers)
  - Or: your custom username
- Click **Add secret**

**Secret 3: PRODUCTION_SSH_KEY**
- Click **New repository secret**
- Name: `PRODUCTION_SSH_KEY`
- Value: **Paste the ENTIRE private key** you copied in Step 3
- Click **Add secret**

**Secret 4: PRODUCTION_PORT** (Optional)
- Click **New repository secret**
- Name: `PRODUCTION_PORT`
- Value: `22` (default SSH port)
- Only add this if you use a custom SSH port
- Click **Add secret**

#### Verify Secrets
You should now see 3-4 secrets listed:
- ✅ PRODUCTION_HOST
- ✅ PRODUCTION_USER
- ✅ PRODUCTION_SSH_KEY
- ✅ PRODUCTION_PORT (optional)

---

### **STEP 5: Prepare Production Server** (5 minutes)

SSH to your server and run:

```bash
# SSH to your server
ssh YOUR_USERNAME@YOUR_SERVER_IP

# Create app directory
sudo mkdir -p /opt/mr-mobile
sudo chown $USER:$USER /opt/mr-mobile

# Clone your repository
cd /opt/mr-mobile
git clone https://github.com/AWGinternational/mr.mobile_awg.git .

# Install Docker (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose (if not installed)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version

# Logout and login again for group changes to take effect
exit
```

SSH back in:

```bash
ssh YOUR_USERNAME@YOUR_SERVER_IP

# Create .env.production file
cd /opt/mr-mobile
nano .env.production
```

**Paste your environment variables** (get these from your local `.env` file):

```bash
# Database
DATABASE_URL="your-production-database-url"

# NextAuth
NEXTAUTH_URL="http://YOUR_SERVER_IP:3000"
NEXTAUTH_SECRET="your-production-secret"

# Redis (optional)
REDIS_URL="your-redis-url"

# Other services...
NODE_ENV="production"
```

Save and exit (Ctrl+X, Y, Enter).

---

### **STEP 6: Test Deployment** (2 minutes)

Now the exciting part! Let's trigger an automatic deployment.

On your **local machine**:

```bash
# Navigate to your project
cd /Users/apple/Documents/mr.mobile

# Make a small change (just to trigger deployment)
echo "# Auto-deploy test" >> README.md

# Commit and push
git add README.md
git commit -m "Test: Enable auto-deployment"
git push origin main
```

---

### **STEP 7: Watch the Magic** ✨

1. **Open GitHub Actions:**
   - Go to: https://github.com/AWGinternational/mr.mobile_awg/actions
   
2. **You'll see TWO workflows running:**
   - 🚀 **CI/CD Pipeline** (15-20 minutes)
     - Runs tests
     - Builds Docker image
     - Pushes to GHCR
   
   - 🚀 **Deploy to Production** (2-3 minutes)
     - Waits for CI/CD to complete
     - Connects to your server via SSH
     - Pulls latest Docker image
     - Restarts containers
     - Verifies health

3. **Monitor Progress:**
   - Click on the running workflow
   - Watch real-time logs
   - Look for "✅ Deployment successful!"

4. **Verify Deployment:**
   ```bash
   # Check if app is running
   curl http://YOUR_SERVER_IP:3000/api/health
   
   # Expected output: {"status":"ok"}
   ```

---

## 🎉 Success!

If you see:
- ✅ Green checkmark on GitHub Actions
- ✅ {"status":"ok"} from health check
- ✅ App accessible at http://YOUR_SERVER_IP:3000

**Congratulations! Auto-deployment is now active!** 🚀

---

## 📝 How to Use It Daily

From now on, whenever you want to update production:

```bash
# 1. Make your changes
code src/components/SomeFile.tsx

# 2. Commit and push
git add .
git commit -m "Add new feature"
git push origin main

# 3. That's it! 
# GitHub will automatically:
# - Test your code
# - Build Docker image
# - Deploy to production
# - Verify it's working

# Wait 15-20 minutes and your changes are LIVE! ✨
```

---

## 🔧 Troubleshooting

### Issue: "Permission denied (publickey)"

**Solution:**
```bash
# Test SSH connection manually
ssh -i ~/.ssh/github_actions_mr_mobile YOUR_USERNAME@YOUR_SERVER_IP

# If this fails, regenerate the key and try again
```

### Issue: "docker: command not found" on server

**Solution:**
```bash
# SSH to server and install Docker
ssh YOUR_USERNAME@YOUR_SERVER_IP
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Issue: Deployment workflow doesn't trigger

**Solution:**
- Make sure CI/CD Pipeline completes successfully first
- Deploy workflow only runs AFTER CI/CD succeeds
- Check: https://github.com/AWGinternational/mr.mobile_awg/actions

### Issue: "Health check failed"

**Solution:**
```bash
# SSH to server
ssh YOUR_USERNAME@YOUR_SERVER_IP

# Check logs
cd /opt/mr-mobile
docker-compose logs --tail=100

# Common fix: Restart containers
docker-compose restart
```

---

## 📞 Need Help?

### Check Logs

**GitHub Actions Logs:**
- Go to: https://github.com/AWGinternational/mr.mobile_awg/actions
- Click on failed workflow
- Read error messages

**Server Logs:**
```bash
ssh YOUR_USERNAME@YOUR_SERVER_IP
cd /opt/mr-mobile
docker-compose logs -f
```

---

## 🎯 Next Steps

Once auto-deploy is working:

1. **Add Domain Name** (optional)
   - Point your domain to server IP
   - Update NEXTAUTH_URL in .env.production
   - Set up SSL with Let's Encrypt

2. **Set Up Monitoring**
   - Add health check cron job
   - Set up email alerts
   - Monitor resource usage

3. **Configure Backups**
   - Automated database backups
   - Daily snapshots
   - Off-site storage

---

## 🌟 Bonus: Setting Up Production Server

### Option 1: DigitalOcean (Recommended - $6/month)

1. **Sign up:**
   - Go to: https://www.digitalocean.com/
   - Use student email for $200 credit
   
2. **Create Droplet:**
   - Click **Create** → **Droplets**
   - Choose: **Ubuntu 22.04 LTS**
   - Plan: **Basic ($6/month)**
   - Datacenter: Closest to Pakistan (e.g., Bangalore, Singapore)
   - Add SSH key (use existing or create new)
   - Hostname: `mr-mobile-production`
   - Click **Create Droplet**

3. **Get IP Address:**
   - Copy droplet's IP address
   - Use this as PRODUCTION_HOST

### Option 2: AWS Free Tier

1. Sign up at: https://aws.amazon.com/free/
2. Launch EC2 instance (t2.micro)
3. Choose Ubuntu 22.04
4. Download .pem key
5. Use elastic IP as PRODUCTION_HOST

### Option 3: Azure for Students

1. Sign up at: https://azure.microsoft.com/students/
2. Create VM (B1s size)
3. Choose Ubuntu 22.04
4. Use public IP as PRODUCTION_HOST

---

## ✅ Final Checklist

Before you start:
- [ ] GitHub repository exists and is accessible
- [ ] You have SSH access to a Linux server
- [ ] Docker is installed on server (or will install in Step 5)
- [ ] You have 20 minutes of focused time

After setup:
- [ ] SSH key generated
- [ ] Public key added to server
- [ ] Private key added to GitHub secrets
- [ ] Server has Docker installed
- [ ] App directory created on server
- [ ] Test deployment successful
- [ ] App accessible from browser

---

**Ready to start? Begin with STEP 1! 🚀**

**Estimated total time: 15-20 minutes**

Good luck! You're about to have enterprise-level automatic deployments! 🎉
