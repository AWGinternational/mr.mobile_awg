#!/bin/bash

# Script to add dark mode classes to all pages
# This adds dark:bg-gray-900 to all bg-gray-50 instances that don't have it

echo "🔧 Adding dark mode classes to all pages..."

# Array of files to update
files=(
  "src/app/daily-closing/page.tsx"
  "src/app/products/page.tsx"
  "src/app/purchases/new/page.tsx"
  "src/app/purchases/[id]/receive/page.tsx"
  "src/app/shops/page.tsx"
  "src/app/approvals/page.tsx"
  "src/app/inventory/page.tsx"
  "src/app/dashboard/admin/page.tsx"
  "src/app/dashboard/owner/page.tsx"
  "src/app/dashboard/admin/shops/page.tsx"
  "src/app/dashboard/admin/panel/page.tsx"
  "src/app/sales/page.tsx"
  "src/app/purchases/page.tsx"
  "src/app/settings/shop/page.tsx"
  "src/app/reports/page.tsx"
)

# Fix main content backgrounds
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Updating: $file"
    
    # Fix bg-gray-50 without dark mode
    sed -i '' 's/className="flex-1 bg-gray-50"/className="flex-1 bg-gray-50 dark:bg-gray-900"/g' "$file"
    sed -i '' 's/className="min-h-screen bg-gray-50"/className="min-h-screen bg-gray-50 dark:bg-gray-900"/g' "$file"
    sed -i '' 's/className="flex min-h-screen bg-gray-50"/className="flex min-h-screen bg-gray-50 dark:bg-gray-900"/g' "$file"
    sed -i '' 's/className="flex h-screen bg-gray-50"/className="flex h-screen bg-gray-50 dark:bg-gray-900"/g' "$file"
    
    # Fix text colors
    sed -i '' 's/text-gray-600"/text-gray-600 dark:text-gray-400"/g' "$file"
    sed -i '' 's/text-gray-900"/text-gray-900 dark:text-white"/g' "$file"
    
    echo "✅ Updated: $file"
  fi
done

echo ""
echo "🎨 Dark mode classes added to all pages!"
echo "Run: npm run dev to see the changes"
