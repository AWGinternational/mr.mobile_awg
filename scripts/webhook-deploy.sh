#!/bin/bash

# ============================================================================
# Mr. Mobile - Webhook Deployment Script
# ============================================================================
# This script is triggered by GitHub webhook when code is pushed
# Install as systemd service or cron job
# ============================================================================

set -e

# Configuration
LOG_FILE="/var/log/mr-mobile/deploy.log"
LOCK_FILE="/var/run/mr-mobile-deploy.lock"
DEPLOY_SCRIPT="/opt/mr-mobile/scripts/deploy-production.sh"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Prevent concurrent deployments
if [ -f "$LOCK_FILE" ]; then
    echo "$(date): Deployment already in progress" >> "$LOG_FILE"
    exit 0
fi

# Create lock file
touch "$LOCK_FILE"

# Clean up lock file on exit
trap "rm -f $LOCK_FILE" EXIT

# Log deployment start
echo "========================================" >> "$LOG_FILE"
echo "$(date): Starting webhook-triggered deployment" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Run deployment script
if bash "$DEPLOY_SCRIPT" >> "$LOG_FILE" 2>&1; then
    echo "$(date): ✅ Deployment successful" >> "$LOG_FILE"
    exit 0
else
    echo "$(date): ❌ Deployment failed" >> "$LOG_FILE"
    exit 1
fi
