#!/bin/bash

# ============================================================================
# Mr. Mobile - Production Deployment Script
# ============================================================================
# This script runs on your production server to deploy the latest version
# Usage: ./deploy.sh
# ============================================================================

set -e  # Exit on error

echo "🚀 Starting Mr. Mobile Deployment..."

# Configuration
APP_DIR="/opt/mr-mobile"
DOCKER_IMAGE="ghcr.io/awginternational/mr.mobile_awg:latest"
CONTAINER_NAME="mr-mobile-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root or with sudo"
    exit 1
fi

# Navigate to app directory
print_status "Navigating to application directory..."
cd "$APP_DIR" || exit 1

# Pull latest code from GitHub (optional, if you want to update configs)
print_status "Pulling latest code from GitHub..."
if git pull origin main; then
    print_status "Code updated successfully"
else
    print_warning "Git pull failed or no changes"
fi

# Login to GitHub Container Registry
print_status "Logging in to GitHub Container Registry..."
if [ -f ~/.github_token ]; then
    cat ~/.github_token | docker login ghcr.io -u awginternational --password-stdin
else
    print_warning "No GitHub token found. Please login manually if needed."
fi

# Pull latest Docker image
print_status "Pulling latest Docker image..."
docker pull "$DOCKER_IMAGE"

# Create backup of current deployment
print_status "Creating backup of current deployment..."
BACKUP_NAME="${CONTAINER_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    docker commit "$CONTAINER_NAME" "$BACKUP_NAME" || print_warning "Backup creation failed"
    print_status "Backup created: $BACKUP_NAME"
fi

# Stop and remove old containers
print_status "Stopping current containers..."
docker-compose down || print_warning "No containers to stop"

# Remove old images (keep last 3)
print_status "Cleaning up old images..."
docker images | grep "$DOCKER_IMAGE" | tail -n +4 | awk '{print $3}' | xargs -r docker rmi || true

# Start new containers
print_status "Starting new containers..."
docker-compose up -d

# Wait for application to start
print_status "Waiting for application to start (30 seconds)..."
sleep 30

# Health check
print_status "Performing health check..."
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "✅ Health check passed!"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            print_warning "Health check failed. Retrying ($RETRY_COUNT/$MAX_RETRIES)..."
            sleep 10
        else
            print_error "Health check failed after $MAX_RETRIES attempts!"
            print_error "Rolling back to previous version..."
            
            # Rollback
            docker-compose down
            if docker images | grep -q "$BACKUP_NAME"; then
                docker tag "$BACKUP_NAME" "$DOCKER_IMAGE"
                docker-compose up -d
                print_warning "Rolled back to previous version"
            fi
            
            exit 1
        fi
    fi
done

# Show running containers
print_status "Current running containers:"
docker-compose ps

# Show logs (last 50 lines)
print_status "Recent logs:"
docker-compose logs --tail=50

# Clean up dangling images
print_status "Cleaning up dangling images..."
docker image prune -f

# Final success message
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment Successful!${NC}"
echo "=========================================="
echo "Application is now running on:"
echo "  - http://localhost:3000"
echo "  - http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To rollback:"
echo "  docker tag $BACKUP_NAME $DOCKER_IMAGE"
echo "  docker-compose up -d"
echo "=========================================="
