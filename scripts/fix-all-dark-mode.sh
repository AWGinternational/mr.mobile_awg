#!/bin/bash

# Script to systematically fix dark mode issues across all pages
# This script adds dark: variants to all grey text elements

echo "🌙 Starting comprehensive dark mode fix..."

# Define the pages to fix in order of priority
PAGES=(
  "src/app/products/page.tsx"
  "src/app/sales/page.tsx"
  "src/app/suppliers/page.tsx"
  "src/app/customers/page.tsx"
  "src/app/inventory/page.tsx"
  "src/app/payments/page.tsx"
  "src/app/loans/page.tsx"
  "src/app/purchases/page.tsx"
  "src/app/purchases/new/page.tsx"
  "src/app/purchases/[id]/page.tsx"
  "src/app/purchases/[id]/receive/page.tsx"
  "src/app/daily-closing/page.tsx"
  "src/app/daily-closing/records/page.tsx"
  "src/app/reports/page.tsx"
  "src/app/mobile-services/page.tsx"
  "src/app/mobile-services/history/page.tsx"
  "src/app/dashboard/owner/page.tsx"
  "src/app/dashboard/worker/page.tsx"
  "src/app/dashboard/admin/page.tsx"
  "src/app/dashboard/admin/users/page.tsx"
  "src/app/settings/shop/page.tsx"
  "src/app/settings/workers/page.tsx"
  "src/app/approvals/page.tsx"
  "src/app/(auth)/login/page.tsx"
)

# Backup function
backup_file() {
  local file=$1
  if [ -f "$file" ]; then
    cp "$file" "${file}.darkmode.bak"
    echo "✅ Backed up: $file"
  fi
}

# Fix function
fix_dark_mode() {
  local file=$1
  if [ ! -f "$file" ]; then
    echo "❌ File not found: $file"
    return 1
  fi
  
  echo "🔧 Fixing: $file"
  
  # Use sed to add dark: variants (macOS compatible)
  # Fix headings
  sed -i '' 's/text-gray-900\([^"]*\)">/text-gray-900 dark:text-white\1">/g' "$file"
  
  # Fix labels and secondary text
  sed -i '' 's/text-gray-600\([^"]*\)">/text-gray-600 dark:text-gray-400\1">/g' "$file"
  sed -i '' 's/text-gray-500\([^"]*\)">/text-gray-500 dark:text-gray-400\1">/g' "$file"
  
  # Fix icons
  sed -i '' 's/text-gray-400\([^"]*\)">/text-gray-400 dark:text-gray-500\1">/g' "$file"
  
  # Fix backgrounds
  sed -i '' 's/bg-gray-100\([^"]*\)">/bg-gray-100 dark:bg-gray-800\1">/g' "$file"
  sed-i '' 's/bg-gray-50\([^"]*\)">/bg-gray-50 dark:bg-gray-700\1">/g' "$file"
  
  echo "✅ Fixed: $file"
}

# Main execution
TOTAL=${#PAGES[@]}
CURRENT=0

for page in "${PAGES[@]}"; do
  CURRENT=$((CURRENT + 1))
  echo ""
  echo "[$CURRENT/$TOTAL] Processing: $page"
  backup_file "$page"
  fix_dark_mode "$page"
done

echo ""
echo "🎉 Dark mode fix completed!"
echo "📝 Backups created with .darkmode.bak extension"
echo "🔍 Please test the pages and verify dark mode is working correctly"
