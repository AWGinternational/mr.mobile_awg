# 🚀 AUTO-DEPLOY: Quick Start Checklist

## ✅ What You Need

- [ ] Production server (DigitalOcean, AWS, etc.)
- [ ] Server IP address: `___.___.___.__` ← Write it here
- [ ] Server username: `________` ← Write it here (usually `root` or `ubuntu`)
- [ ] 20 minutes of time

---

## 📋 Follow These Steps IN ORDER

### ✅ STEP 1: Generate SSH Key (2 min)

Open Terminal and run:

```bash
ssh-keygen -t ed25519 -C "github-actions@mr-mobile" -f ~/.ssh/github_actions_mr_mobile
```

Press ENTER twice (no passphrase needed).

---

### ✅ STEP 2: Copy Key to Server (2 min)

```bash
# Replace YOUR_USERNAME and YOUR_SERVER_IP with your actual details!
ssh-copy-id -i ~/.ssh/github_actions_mr_mobile.pub YOUR_USERNAME@YOUR_SERVER_IP
```

**Example:**
```bash
ssh-copy-id -i ~/.ssh/github_actions_mr_mobile.pub root@165.232.123.45
```

---

### ✅ STEP 3: Get Private Key (1 min)

```bash
cat ~/.ssh/github_actions_mr_mobile
```

**Copy EVERYTHING** (including BEGIN and END lines) to clipboard.

---

### ✅ STEP 4: Add to GitHub (5 min)

1. Go to: https://github.com/AWGinternational/mr.mobile_awg/settings/secrets/actions

2. Click **"New repository secret"** and add these 3 secrets:

   **Secret 1:**
   - Name: `PRODUCTION_HOST`
   - Value: Your server IP (e.g., `165.232.123.45`)
   
   **Secret 2:**
   - Name: `PRODUCTION_USER`
   - Value: Your SSH username (e.g., `root` or `ubuntu`)
   
   **Secret 3:**
   - Name: `PRODUCTION_SSH_KEY`
   - Value: Paste the private key you copied in Step 3

---

### ✅ STEP 5: Setup Server (5 min)

SSH to your server:

```bash
ssh YOUR_USERNAME@YOUR_SERVER_IP
```

Run these commands:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
sudo mkdir -p /opt/mr-mobile
sudo chown $USER:$USER /opt/mr-mobile

# Clone repository
cd /opt/mr-mobile
git clone https://github.com/AWGinternational/mr.mobile_awg.git .

# Create environment file
nano .env.production
```

Paste your production environment variables, then save (Ctrl+X, Y, Enter).

**Minimum required:**
```bash
DATABASE_URL="your-database-url"
NEXTAUTH_URL="http://YOUR_SERVER_IP:3000"
NEXTAUTH_SECRET="generate-a-secret-here"
NODE_ENV="production"
```

Type `exit` to logout from server.

---

### ✅ STEP 6: Test It! (2 min)

On your Mac:

```bash
cd /Users/apple/Documents/mr.mobile

# Make a small change
echo "# Test auto-deploy" >> README.md

# Push to GitHub
git add .
git commit -m "Test: Enable auto-deployment"
git push origin main
```

---

### ✅ STEP 7: Watch It Deploy! (15-20 min)

1. Open: https://github.com/AWGinternational/mr.mobile_awg/actions

2. Watch for TWO workflows:
   - ✅ CI/CD Pipeline (15 min)
   - ✅ Deploy to Production (2 min)

3. After both complete, test:
   ```bash
   curl http://YOUR_SERVER_IP:3000/api/health
   ```

If you see `{"status":"ok"}` → **SUCCESS!** 🎉

---

## 🎯 Daily Usage

From now on, to update production:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Done! Auto-deploys in 15-20 minutes ✨
```

---

## 🆘 Troubleshooting

**Problem: Can't connect to server**
```bash
# Test SSH manually
ssh -i ~/.ssh/github_actions_mr_mobile YOUR_USERNAME@YOUR_SERVER_IP
```

**Problem: Docker not found on server**
```bash
# SSH to server and install
ssh YOUR_USERNAME@YOUR_SERVER_IP
curl -fsSL https://get.docker.com | sudo sh
```

**Problem: Deployment fails**
```bash
# Check logs on server
ssh YOUR_USERNAME@YOUR_SERVER_IP
cd /opt/mr-mobile
docker-compose logs --tail=100
```

---

## 📞 Need More Help?

Read the detailed guide:
```bash
open AUTO-DEPLOY-SETUP-GUIDE.md
```

---

## ✅ Final Checklist

Before you're done, verify:

- [ ] SSH key generated
- [ ] SSH key copied to server
- [ ] 3 secrets added to GitHub
- [ ] Docker installed on server
- [ ] Repository cloned on server
- [ ] .env.production created
- [ ] Test deployment successful
- [ ] App accessible at http://YOUR_SERVER_IP:3000

---

**🎉 Once complete, you have enterprise-level auto-deployment!**

**Time investment: 20 minutes**  
**Benefit: Save 5-10 minutes on every deployment forever!**

---

**START HERE:** Follow STEP 1 above! 👆
