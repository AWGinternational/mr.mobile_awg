# App Icon Setup Instructions

## Current Status
✅ SVG icon created at `/public/icon.svg`
✅ Manifest.json created for PWA support
✅ Metadata updated in layout.tsx

## Mobile Phone Shop Icon Design
The icon features:
- 📱 White mobile phone on teal background (#0d9488)
- 🏷️ Yellow price tag with PKR symbol
- Modern, professional design

## To Complete Icon Setup:

### Option 1: Using Online Tool (Recommended)
1. Open https://realfavicongenerator.net/
2. Upload `/public/icon.svg`
3. Download the generated favicon package
4. Extract and place files in `/public/` folder:
   - `favicon.ico`
   - `icon.png` (32x32)
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)
   - `apple-icon.png` (180x180)

### Option 2: Using ImageMagick (If installed)
```bash
cd public

# Convert SVG to different sizes
convert icon.svg -resize 32x32 icon.png
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 512x512 icon-512.png
convert icon.svg -resize 180x180 apple-icon.png

# Create favicon.ico
convert icon.svg -resize 16x16 -resize 32x32 -resize 48x48 favicon.ico
```

### Option 3: Using Figma/Canva
1. Open the SVG in Figma or Canva
2. Export as PNG in different sizes:
   - 32x32 → `icon.png`
   - 192x192 → `icon-192.png`
   - 512x512 → `icon-512.png`
   - 180x180 → `apple-icon.png`
3. Use an online ICO converter for `favicon.ico`

## What's Already Done
✅ `manifest.json` - PWA configuration
✅ `icon.svg` - Master icon file
✅ Metadata in `layout.tsx` with proper icon references
✅ App name: "Mr. Mobile - Shop Management System"
✅ Theme color: Teal (#0d9488)

## Quick Test
After adding the PNG files, test by:
1. Opening browser DevTools → Application → Manifest
2. Checking if all icons load
3. Looking at the browser tab for the new favicon
4. Testing "Add to Home Screen" on mobile

## Icon Sizes Reference
- `favicon.ico` - 16x16, 32x32, 48x48 (browser tab)
- `icon.png` - 32x32 (general use)
- `icon-192.png` - 192x192 (Android/PWA)
- `icon-512.png` - 512x512 (High-res PWA)
- `apple-icon.png` - 180x180 (iOS home screen)
