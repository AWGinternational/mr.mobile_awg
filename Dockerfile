# ============================================================================
# Mr. Mobile - Production-Ready Multi-Stage Dockerfile
# ============================================================================
# Optimized for: Security, Size, Performance, and Caching
# Build stages: deps → builder → runner
# Final image size: ~150-200MB (optimized)
# ============================================================================

# ============================================================================
# Stage 1: Dependencies
# Purpose: Install production dependencies only
# Caching: This layer is cached unless package files change
# ============================================================================
FROM node:20-alpine AS deps

# Install system dependencies for Prisma and native modules
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

    # Copy package files for dependency installation
    COPY package.json package-lock.json* ./
    
    # Install dependencies with npm ci (faster, more reliable than npm install)
    # --production=false to install all dependencies (dev + prod) needed for build
    # Use --legacy-peer-deps to handle peer dependency conflicts if needed
    RUN if [ -f package-lock.json ]; then npm ci --prefer-offline --no-audit --legacy-peer-deps; else npm install --prefer-offline --no-audit; fi
    
# ============================================================================
# Stage 2: Builder
# Purpose: Build the Next.js application
# Optimizations: Standalone output, telemetry disabled
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage (leverages Docker layer caching)
COPY --from=deps /app/node_modules ./node_modules

# Copy all application source code
COPY . .

# Generate Prisma Client (required before build)
RUN npx prisma generate

# Set build-time environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Provide dummy DATABASE_URL for build-time (Next.js needs it for page data collection)
# This will be overridden at runtime with actual database connection
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

# Build Next.js application
# This creates .next/standalone directory with minimal dependencies
RUN npm run build

# Note: We keep node_modules/.prisma and prisma/ for the runner stage
# Clean up only unnecessary files to reduce image size
# Keep prisma/migrations for potential runtime migrations
RUN rm -rf .git \
    && rm -rf src

# ============================================================================
# Stage 3: Runner (Production)
# Purpose: Minimal production runtime environment
# Security: Non-root user, minimal dependencies
# ============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install only runtime dependencies (OpenSSL for Prisma)
RUN apk add --no-cache \
    openssl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Set production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Create non-root user and group for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy built application from builder stage
# These are minimal files needed to run Next.js in standalone mode
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create directory for logs
RUN mkdir -p /app/logs && chown -R nextjs:nodejs /app/logs

# Switch to non-root user (security best practice)
USER nextjs

# Expose application port
EXPOSE 3000

# Health check endpoint for container orchestration
# Checks /api/health every 30 seconds
# Retries 3 times before marking container as unhealthy
HEALTHCHECK --interval=30s \
    --timeout=10s \
    --start-period=40s \
    --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init to handle signals properly
# Prevents zombie processes and ensures graceful shutdown
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start Next.js server
CMD ["node", "server.js"]

# ============================================================================
# Build Instructions:
# docker build -t mr-mobile:latest .
# 
# Run Instructions:
# docker run -p 3000:3000 --env-file .env.production mr-mobile:latest
#
# Multi-platform Build (for ARM64 + AMD64):
# docker buildx build --platform linux/amd64,linux/arm64 -t mr-mobile:latest .
# ============================================================================
