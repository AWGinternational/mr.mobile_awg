#!/bin/bash

# Reset Next.js development environment
# This script clears all caches and rebuilds the project

echo "🧹 Clearing Next.js cache..."
rm -rf .next

echo "🧹 Clearing node_modules cache..."
rm -rf node_modules/.cache

echo "🧹 Clearing Turbopack cache..."
rm -rf .turbo

echo "✅ Cache cleared successfully!"
echo ""
echo "📦 Starting development server..."
echo "   Run: npm run dev"
echo ""

