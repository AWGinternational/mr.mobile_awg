#!/bin/bash

# ==============================================================================
# Mr. Mobile - GitHub Push Script
# ==============================================================================
# This script prepares and pushes your code to GitHub
# Run: chmod +x scripts/push-to-github.sh && ./scripts/push-to-github.sh
# ==============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_header "Mr. Mobile - GitHub Push Script"

# Step 1: Check for .env file
print_warning "Checking for sensitive files..."
if [ -f ".env" ] || [ -f ".env.local" ]; then
    print_warning "Found .env files. These will NOT be pushed (ignored by .gitignore)"
fi

# Step 2: Create .env.example if it doesn't exist
if [ ! -f ".env.example" ]; then
    print_warning ".env.example not found. Creating template..."
    cat > .env.example << 'EOF'
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-64"
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
RESEND_API_KEY=""
FROM_EMAIL=""
EOF
    print_success "Created .env.example"
fi

# Step 3: Check git initialization
if [ ! -d ".git" ]; then
    print_warning "Git repository not initialized. Initializing..."
    git init
    print_success "Git repository initialized"
fi

# Step 4: Get GitHub username
print_header "GitHub Configuration"
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    print_error "GitHub username is required"
    exit 1
fi

# Step 5: Update .do/app.yaml with GitHub username
if [ -f ".do/app.yaml" ]; then
    sed -i.bak "s/YOUR_GITHUB_USERNAME/$GITHUB_USERNAME/g" .do/app.yaml
    rm .do/app.yaml.bak
    print_success "Updated .do/app.yaml with your GitHub username"
fi

# Step 6: Check for uncommitted changes
print_header "Checking Git Status"
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes"
    
    # Show status
    git status --short
    
    echo ""
    read -p "Do you want to add all files? (y/n): " ADD_ALL
    
    if [ "$ADD_ALL" = "y" ] || [ "$ADD_ALL" = "Y" ]; then
        git add .
        print_success "All files staged for commit"
    else
        print_warning "Please manually stage your files with: git add <file>"
        exit 1
    fi
else
    print_success "Working directory is clean"
fi

# Step 7: Commit changes
if [ -n "$(git diff --cached --name-only)" ]; then
    print_header "Commit Changes"
    
    # Generate default commit message
    DEFAULT_MESSAGE="Deploy: Ready for production deployment

Changes:
- Added Docker configuration
- Added DigitalOcean App Platform config
- Added CI/CD pipeline
- Added deployment documentation
- Configured for production deployment"
    
    echo "Default commit message:"
    echo "$DEFAULT_MESSAGE"
    echo ""
    read -p "Use default message? (y/n): " USE_DEFAULT
    
    if [ "$USE_DEFAULT" = "y" ] || [ "$USE_DEFAULT" = "Y" ]; then
        git commit -m "$DEFAULT_MESSAGE"
    else
        read -p "Enter your commit message: " COMMIT_MESSAGE
        git commit -m "$COMMIT_MESSAGE"
    fi
    
    print_success "Changes committed"
else
    print_warning "No changes to commit"
fi

# Step 8: Check remote repository
print_header "GitHub Repository Setup"

if git remote | grep -q "origin"; then
    REMOTE_URL=$(git remote get-url origin)
    print_warning "Remote 'origin' already exists: $REMOTE_URL"
    read -p "Do you want to update it? (y/n): " UPDATE_REMOTE
    
    if [ "$UPDATE_REMOTE" = "y" ] || [ "$UPDATE_REMOTE" = "Y" ]; then
        git remote remove origin
        git remote add origin "https://github.com/$GITHUB_USERNAME/mr.mobile.git"
        print_success "Remote updated"
    fi
else
    git remote add origin "https://github.com/$GITHUB_USERNAME/mr.mobile.git"
    print_success "Remote 'origin' added"
fi

# Step 9: Push to GitHub
print_header "Push to GitHub"

# Check if main branch exists
if ! git show-ref --verify --quiet refs/heads/main; then
    print_warning "Renaming branch to 'main'"
    git branch -M main
fi

print_warning "Pushing to GitHub..."
echo ""
echo "If this is your first push, you'll need to:"
echo "1. Create a new repository on GitHub: https://github.com/new"
echo "2. Name it: mr.mobile"
echo "3. Keep it Private (recommended)"
echo "4. DON'T initialize with README"
echo ""
read -p "Have you created the repository on GitHub? (y/n): " REPO_CREATED

if [ "$REPO_CREATED" != "y" ] && [ "$REPO_CREATED" != "Y" ]; then
    print_warning "Please create the repository first, then run this script again"
    exit 1
fi

# Try to push
if git push -u origin main 2>&1; then
    print_success "Code pushed to GitHub successfully! 🎉"
else
    print_warning "First push failed. Trying with force..."
    if git push -u origin main --force; then
        print_success "Code pushed to GitHub successfully! 🎉"
    else
        print_error "Push failed. Please check your GitHub credentials and repository settings"
        exit 1
    fi
fi

# Step 10: Summary
print_header "Deployment Summary"
echo -e "${GREEN}✅ Code successfully pushed to GitHub!${NC}"
echo ""
echo "📦 Repository URL:"
echo "   https://github.com/$GITHUB_USERNAME/mr.mobile"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Setup External Services (if not done):"
echo "   - Neon Database: https://neon.tech"
echo "   - Upstash Redis: https://upstash.com"
echo "   - Cloudinary: https://cloudinary.com"
echo "   - Resend Email: https://resend.com"
echo ""
echo "2. Deploy to DigitalOcean App Platform:"
echo "   - Visit: https://cloud.digitalocean.com/apps"
echo "   - Click 'Create App'"
echo "   - Connect your GitHub repository"
echo "   - Add environment variables"
echo "   - Deploy!"
echo ""
echo "3. Or deploy to DigitalOcean Droplet:"
echo "   - See: DEPLOYMENT-GUIDE.md"
echo ""
echo "4. Or test locally with Docker:"
echo "   docker-compose up -d"
echo ""
echo "📖 Full deployment guide: DEPLOYMENT-GUIDE.md"
echo ""
print_success "Happy deploying! 🎉"
