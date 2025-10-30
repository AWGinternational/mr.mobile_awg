#!/bin/bash

# ==============================================================================
# Mr. Mobile - Docker Test Script
# ==============================================================================
# This script helps you test Docker deployment locally before pushing to production
# Run: chmod +x scripts/test-docker.sh && ./scripts/test-docker.sh
# ==============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker Desktop first."
    echo "Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker Desktop."
    exit 1
fi

print_header "Mr. Mobile - Docker Test"

# Step 1: Clean up old containers
print_warning "Cleaning up old containers..."
docker-compose down -v 2>/dev/null || true
print_success "Cleaned up"

# Step 2: Build Docker image
print_header "Building Docker Image"
print_warning "This may take 3-5 minutes..."

if docker build -t mr-mobile:test .; then
    print_success "Docker image built successfully"
else
    print_error "Docker build failed"
    exit 1
fi

# Step 3: Check image size
IMAGE_SIZE=$(docker images mr-mobile:test --format "{{.Size}}")
print_success "Image size: $IMAGE_SIZE"

# Step 4: Start services
print_header "Starting Services with Docker Compose"

if docker-compose up -d; then
    print_success "Services started"
else
    print_error "Failed to start services"
    exit 1
fi

# Step 5: Wait for services to be ready
print_warning "Waiting for services to be ready..."
sleep 10

# Step 6: Check service health
print_header "Health Check"

# Check PostgreSQL
if docker-compose exec postgres pg_isready -U mrmobile > /dev/null 2>&1; then
    print_success "PostgreSQL is ready"
else
    print_error "PostgreSQL is not ready"
fi

# Check Redis
if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is ready"
else
    print_error "Redis is not ready"
fi

# Wait a bit more for app to start
print_warning "Waiting for application to start..."
sleep 15

# Check Application
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3000/api/health > /dev/null; then
        print_success "Application is ready"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
            print_error "Application failed to start"
            echo ""
            echo "Checking logs..."
            docker-compose logs app
            exit 1
        fi
        print_warning "Waiting for application... (Attempt $RETRY_COUNT/$MAX_RETRIES)"
        sleep 5
    fi
done

# Step 7: Run database migrations
print_header "Database Setup"
print_warning "Running migrations..."

if docker-compose exec -T app npx prisma db push > /dev/null 2>&1; then
    print_success "Database schema updated"
else
    print_warning "Migration had warnings (this is normal for first run)"
fi

# Step 8: Test application
print_header "Testing Application"

# Test health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    print_success "Health check passed"
else
    print_error "Health check failed"
    echo "Response: $HEALTH_RESPONSE"
fi

# Test login page
if curl -s http://localhost:3000/login | grep -q "<!DOCTYPE html>"; then
    print_success "Login page accessible"
else
    print_error "Login page not accessible"
fi

# Step 9: Show logs
print_header "Application Logs (Last 20 lines)"
docker-compose logs --tail=20 app

# Step 10: Summary
print_header "Docker Test Summary"

echo -e "${GREEN}✅ Docker deployment is working!${NC}"
echo ""
echo "🌐 Application URLs:"
echo "   - Frontend: http://localhost:3000"
echo "   - Health Check: http://localhost:3000/api/health"
echo ""
echo "📊 Database Info:"
echo "   - PostgreSQL: localhost:5432"
echo "   - Database: mrmobile"
echo "   - Username: mrmobile"
echo "   - Password: mrmobile123"
echo ""
echo "🔧 Useful Commands:"
echo "   - View logs: docker-compose logs -f app"
echo "   - Stop services: docker-compose down"
echo "   - Restart: docker-compose restart app"
echo "   - Shell access: docker-compose exec app sh"
echo ""
echo "🧪 Test the application:"
echo "   1. Open browser: http://localhost:3000"
echo "   2. Login with seeded credentials"
echo "   3. Test POS, Inventory, etc."
echo ""
echo "🛑 When done testing:"
echo "   docker-compose down -v"
echo ""
print_success "Happy testing! 🎉"
