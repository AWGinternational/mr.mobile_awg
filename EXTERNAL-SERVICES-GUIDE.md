# 🌐 External Services Setup Guide

This guide covers setting up all FREE external services for the Mr. Mobile application.

---

## 📋 Services Overview

| Service | Purpose | FREE Tier | Setup Time |
|---------|---------|-----------|------------|
| **Neon** | PostgreSQL Database | 0.5GB storage, unlimited compute | 5 min |
| **Upstash** | Redis Cache | 10K commands/day, 256MB | 3 min |
| **Cloudinary** | Image Storage | 25GB bandwidth/month | 5 min |
| **Resend** | Email Service | 3,000 emails/month | 3 min |

**Total cost**: $0/month forever ✅

---

## 🗄️ 1. Neon PostgreSQL Setup

### What is Neon?

Neon is a serverless PostgreSQL platform with:
- ✅ **FREE** 0.5GB storage
- ✅ **Unlimited** compute hours (no sleep/wake delays like Heroku)
- ✅ **Instant** branching (great for development)
- ✅ **Auto-scaling** and auto-suspend
- ✅ **Global** edge network

### Step-by-Step Setup

#### 1. Create Neon Account

1. Go to: https://neon.tech
2. Click **"Sign Up"**
3. Sign up with:
   - GitHub (recommended - automatic authentication)
   - OR: Email address

#### 2. Create New Project

1. After login, click **"New Project"**
2. **Project settings**:
   ```
   Name: mr-mobile-production
   PostgreSQL Version: 15 (recommended)
   Region: AWS us-east-1 (or closest to your users)
   ```
3. Click **"Create Project"**

#### 3. Get Connection String

After creation, you'll see connection details:

```
Host: ep-cool-darkness-123456.us-east-1.aws.neon.tech
Database: neondb
User: your-username
Password: <hidden>
```

**Full connection string** (click "Connection string"):
```
postgresql://username:password@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
```

#### 4. Configure Database

Copy the connection string and add to your `.env`:

```bash
DATABASE_URL="postgresql://username:password@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

#### 5. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# OR: Run migrations
npx prisma migrate deploy

# Verify connection
npx prisma db seed  # If you have seed data
```

#### 6. Verify Database

Test the connection:

```bash
# Using Prisma Studio
npx prisma studio

# OR: Connect via psql
psql "postgresql://username:password@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Neon Features You Should Know

#### Branching (Development Databases)

Create instant database branches for development:

1. Go to Neon dashboard → **"Branches"**
2. Click **"Create branch"**
3. Name: `development` or `staging`
4. Use branch connection string for local development

#### Auto-Suspend

Neon automatically suspends inactive databases (saves compute):
- Suspends after **5 minutes** of inactivity
- Wakes up in **<500ms** on first query
- **No cold starts** affecting users

#### Connection Pooling

Neon provides built-in connection pooling:

```bash
# Pooled connection (recommended for serverless)
postgresql://username:password@ep-cool-darkness-123456-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# Direct connection (for migrations)
postgresql://username:password@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
```

Use **pooled** for production, **direct** for migrations.

---

## 🔴 2. Upstash Redis Setup

### What is Upstash?

Upstash is serverless Redis with:
- ✅ **FREE** 10,000 commands/day
- ✅ **256MB** storage
- ✅ **No sleep/wake** delays
- ✅ **Global** replication
- ✅ **Pay-per-request** pricing (after free tier)

### Step-by-Step Setup

#### 1. Create Upstash Account

1. Go to: https://upstash.com
2. Click **"Login"** → Sign up with:
   - GitHub (recommended)
   - OR: Email

#### 2. Create Redis Database

1. Click **"Create Database"**
2. **Database settings**:
   ```
   Name: mr-mobile-cache
   Type: Regional (cheaper)
   Region: AWS us-east-1 (same as Neon)
   TLS: Enabled (recommended)
   Eviction: allkeys-lru (remove old keys automatically)
   ```
3. Click **"Create"**

#### 3. Get Connection Details

After creation, you'll see:

**REST API** (for serverless):
```
Endpoint: https://relaxed-mantis-12345.upstash.io
Token: AXXXAbQN...
```

**Redis URL** (for traditional Redis clients):
```
redis://default:password@relaxed-mantis-12345.upstash.io:6379
```

#### 4. Add to Environment Variables

Choose ONE method:

##### Option A: REST API (Recommended for Next.js)

```bash
# .env
UPSTASH_REDIS_REST_URL="https://relaxed-mantis-12345.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXXXAbQN..."
```

##### Option B: Redis URL (Traditional)

```bash
# .env
REDIS_URL="redis://default:password@relaxed-mantis-12345.upstash.io:6379"
```

#### 5. Install Upstash SDK

```bash
# For REST API (recommended)
npm install @upstash/redis

# OR: For traditional Redis client
npm install ioredis
```

#### 6. Example Usage

**REST API method**:

```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Example: Cache user sessions
await redis.set('user:123', JSON.stringify(userData), { ex: 3600 })
const user = await redis.get('user:123')
```

**Traditional Redis method**:

```typescript
// lib/redis.ts
import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL!)

// Example: Cache product data
await redis.setex('product:456', 3600, JSON.stringify(productData))
const product = await redis.get('product:456')
```

#### 7. Verify Connection

Test Redis connection:

```bash
# Create test script: scripts/test-redis.ts
import { redis } from './lib/redis'

async function testRedis() {
  await redis.set('test', 'Hello from Mr. Mobile!')
  const result = await redis.get('test')
  console.log('Redis test:', result)
}

testRedis()
```

### Upstash Redis Use Cases

1. **Session Storage**: Store user sessions
2. **Rate Limiting**: API rate limiting
3. **Caching**: Cache database queries
4. **Queue**: Background job queues
5. **Real-time**: Pub/sub for real-time features

---

## 📦 3. Cloudinary Setup

### What is Cloudinary?

Cloudinary is image/video hosting with:
- ✅ **FREE** 25GB bandwidth/month
- ✅ **25GB** storage
- ✅ **Automatic** image optimization
- ✅ **On-the-fly** transformations
- ✅ **CDN** delivery

### Step-by-Step Setup

#### 1. Create Cloudinary Account

1. Go to: https://cloudinary.com/users/register/free
2. Fill in:
   ```
   Name: Your Name
   Email: your@email.com
   Create your cloud name: mrmobile (or your choice)
   ```
3. Verify email

#### 2. Get API Credentials

After login, go to **Dashboard**:

```
Cloud Name: mrmobile
API Key: 123456789012345
API Secret: AbCdEfGhIjKlMnOpQrStUvWxYz
```

#### 3. Add to Environment Variables

```bash
# .env
CLOUDINARY_CLOUD_NAME="mrmobile"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="AbCdEfGhIjKlMnOpQrStUvWxYz"
```

#### 4. Install Cloudinary SDK

```bash
npm install cloudinary
```

#### 5. Configure Cloudinary

```typescript
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary
```

#### 6. Example Usage

**Upload product image**:

```typescript
// API route: /api/products/upload
import cloudinary from '@/lib/cloudinary'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  
  // Convert File to base64
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = buffer.toString('base64')
  const dataURI = `data:${file.type};base64,${base64}`
  
  // Upload to Cloudinary
  const result = await cloudinary.uploader.upload(dataURI, {
    folder: 'mr-mobile/products',
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  })
  
  return Response.json({ url: result.secure_url })
}
```

**Display optimized image**:

```tsx
// components/ProductImage.tsx
import Image from 'next/image'

export function ProductImage({ publicId }: { publicId: string }) {
  const cloudinaryUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_400,c_fill,q_auto,f_auto/${publicId}`
  
  return (
    <Image
      src={cloudinaryUrl}
      alt="Product"
      width={400}
      height={400}
    />
  )
}
```

#### 7. Configure Next.js for Cloudinary

Update `next.config.ts`:

```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/**`,
      },
    ],
  },
}
```

### Cloudinary Optimization Features

#### Image Transformations

```
Original: 2MB, 4000x3000px
Optimized: 50KB, 800x800px, WebP format

URL: https://res.cloudinary.com/mrmobile/image/upload/
     w_800,h_800,c_fill,q_auto,f_auto/products/phone-123.jpg
     │       │       │       │       │
     │       │       │       │       └─ Format: Auto (WebP for modern browsers)
     │       │       │       └─ Quality: Auto
     │       │       └─ Crop: Fill
     │       └─ Height: 800px
     └─ Width: 800px
```

#### Common Use Cases

1. **Product Images**: Auto-optimized product photos
2. **User Avatars**: Circular profile pictures
3. **Shop Logos**: Brand images
4. **Receipts**: PDF/image receipts
5. **Documents**: Invoice and warranty documents

---

## 📧 4. Resend Email Setup

### What is Resend?

Resend is modern email service with:
- ✅ **FREE** 3,000 emails/month
- ✅ **100** emails/day
- ✅ **Beautiful** email templates
- ✅ **99.9%** deliverability
- ✅ **Easy** API

### Step-by-Step Setup

#### 1. Create Resend Account

1. Go to: https://resend.com/signup
2. Sign up with:
   - Email address
   - Verify email

#### 2. Get API Key

1. After login, go to **"API Keys"**
2. Click **"Create API Key"**
3. Settings:
   ```
   Name: Mr. Mobile Production
   Permission: Full Access (or Sending Access)
   ```
4. Copy the API key (starts with `re_...`)

#### 3. Add to Environment Variables

```bash
# .env
RESEND_API_KEY="re_123456789_AbCdEfGhIjKlMnOpQrStUvWx"
```

#### 4. Install Resend SDK

```bash
npm install resend
```

#### 5. Configure Resend

```typescript
// lib/resend.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)
```

#### 6. Example Usage

**Send welcome email**:

```typescript
// API route: /api/auth/send-welcome
import { resend } from '@/lib/resend'

export async function POST(req: Request) {
  const { email, name } = await req.json()
  
  const { data, error } = await resend.emails.send({
    from: 'Mr. Mobile <onboarding@yourdomain.com>',
    to: [email],
    subject: 'Welcome to Mr. Mobile!',
    html: `
      <h1>Welcome ${name}!</h1>
      <p>Thank you for registering with Mr. Mobile.</p>
      <p>Your account is now active.</p>
    `
  })
  
  if (error) {
    return Response.json({ error }, { status: 500 })
  }
  
  return Response.json({ success: true })
}
```

**Send loan payment reminder**:

```typescript
await resend.emails.send({
  from: 'Mr. Mobile <notifications@yourdomain.com>',
  to: [customer.email],
  subject: 'Payment Reminder - Installment Due',
  html: `
    <h2>Payment Reminder</h2>
    <p>Dear ${customer.name},</p>
    <p>Your installment of PKR ${amount} is due on ${dueDate}.</p>
    <p>Please pay at your nearest shop location.</p>
  `
})
```

#### 7. Domain Setup (Optional, for Production)

For better deliverability, add your own domain:

1. Go to Resend → **"Domains"**
2. Click **"Add Domain"**
3. Enter: `yourdomain.com`
4. Add DNS records to your domain provider:
   ```
   Type: TXT
   Name: @
   Value: [Resend verification code]
   
   Type: MX
   Name: @
   Value: mx1.resend.com (Priority: 10)
   ```
5. Wait for verification (5-30 minutes)

**Before domain setup**:
```
From: onboarding@resend.dev
```

**After domain setup**:
```
From: notifications@yourdomain.com
```

### Email Templates (React Email)

For beautiful emails, use React Email:

```bash
npm install react-email @react-email/components
```

Create template:

```tsx
// emails/welcome-email.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
} from '@react-email/components'

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>Welcome to Mr. Mobile!</Heading>
          <Text>Hi {name},</Text>
          <Text>Thank you for joining us.</Text>
          <Button href="https://yourdomain.com/dashboard">
            Go to Dashboard
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
```

Send with Resend:

```typescript
import { WelcomeEmail } from '@/emails/welcome-email'
import { render } from '@react-email/render'

const html = render(WelcomeEmail({ name: 'John' }))

await resend.emails.send({
  from: 'Mr. Mobile <onboarding@yourdomain.com>',
  to: ['john@example.com'],
  subject: 'Welcome!',
  html
})
```

---

## 🔐 Environment Variables Summary

### Complete .env File

```bash
# ============================================================================
# DATABASE (Neon PostgreSQL)
# ============================================================================
DATABASE_URL="postgresql://username:password@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"

# ============================================================================
# AUTHENTICATION (NextAuth.js)
# ============================================================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# ============================================================================
# REDIS (Upstash) - Choose ONE method
# ============================================================================
# Option A: REST API (Recommended)
UPSTASH_REDIS_REST_URL="https://relaxed-mantis-12345.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXXXAbQN..."

# Option B: Redis URL (Traditional)
# REDIS_URL="redis://default:password@relaxed-mantis-12345.upstash.io:6379"

# ============================================================================
# IMAGE STORAGE (Cloudinary)
# ============================================================================
CLOUDINARY_CLOUD_NAME="mrmobile"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="AbCdEfGhIjKlMnOpQrStUvWxYz"

# Public URL for Next.js Image component
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="mrmobile"

# ============================================================================
# EMAIL SERVICE (Resend)
# ============================================================================
RESEND_API_KEY="re_123456789_AbCdEfGhIjKlMnOpQrStUvWx"

# ============================================================================
# OPTIONAL: Rate Limiting & Analytics
# ============================================================================
# Use Upstash Redis for rate limiting
RATE_LIMIT_ENABLED="true"

# ============================================================================
# PRODUCTION SETTINGS
# ============================================================================
NODE_ENV="production"
```

### Add to GitHub Secrets

For CI/CD and deployment, add these to GitHub:

1. Go to: `https://github.com/YOUR_USERNAME/mr-mobile/settings/secrets/actions`
2. Add each variable as a secret

---

## ✅ Verification Checklist

### Neon Database
- [ ] Account created
- [ ] Project created
- [ ] Connection string copied
- [ ] `DATABASE_URL` added to `.env`
- [ ] Prisma migrations run
- [ ] Can connect via `npx prisma studio`

### Upstash Redis
- [ ] Account created
- [ ] Redis database created
- [ ] REST API credentials copied
- [ ] `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` added to `.env`
- [ ] SDK installed (`@upstash/redis`)
- [ ] Test connection successful

### Cloudinary
- [ ] Account created
- [ ] Cloud name, API Key, API Secret copied
- [ ] All three credentials added to `.env`
- [ ] SDK installed (`cloudinary`)
- [ ] `next.config.ts` updated with image domains
- [ ] Test upload successful

### Resend
- [ ] Account created
- [ ] API key created and copied
- [ ] `RESEND_API_KEY` added to `.env`
- [ ] SDK installed (`resend`)
- [ ] Test email sent successfully
- [ ] (Optional) Domain verified

---

## 🎯 Next Steps

1. **Test Locally**:
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   
   # Add all credentials
   nano .env
   
   # Run migrations
   npx prisma db push
   
   # Start development server
   npm run dev
   ```

2. **Add to GitHub Secrets**:
   - See GITHUB-SETUP-GUIDE.md

3. **Deploy to Production**:
   - See DEPLOYMENT-GUIDE.md

---

## 🆘 Troubleshooting

### Neon: "Connection timeout"

**Solution**:
```bash
# Check SSL mode is enabled
DATABASE_URL="...?sslmode=require"

# Try pooled connection
DATABASE_URL="...-pooler.us-east-1.aws.neon.tech/..."
```

### Upstash: "401 Unauthorized"

**Solution**:
```bash
# Check token is correct (no spaces)
UPSTASH_REDIS_REST_TOKEN="AXXXAbQN..."

# Regenerate token in Upstash dashboard if needed
```

### Cloudinary: "Invalid API Key"

**Solution**:
```bash
# Check all three credentials are correct
CLOUDINARY_CLOUD_NAME="mrmobile"  # No quotes in some cases
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="AbCdEfGh..."

# Test with Cloudinary console:
# https://cloudinary.com/console/c-{cloud_name}
```

### Resend: "Domain not verified"

**Solution**:
```bash
# For development, use @resend.dev domain:
from: 'Mr. Mobile <onboarding@resend.dev>'

# For production, verify your domain:
# 1. Add domain in Resend dashboard
# 2. Add DNS records
# 3. Wait 30 minutes
# 4. Check verification status
```

---

## 💰 Cost Breakdown

| Service | FREE Tier | Overage Cost | 40-50 Users Estimate |
|---------|-----------|--------------|----------------------|
| **Neon** | 0.5GB storage | $0.10/GB after | ~100-200MB = FREE ✅ |
| **Upstash** | 10K commands/day | $0.2 per 100K | ~5K/day = FREE ✅ |
| **Cloudinary** | 25GB bandwidth | $0.14/GB after | ~10GB/month = FREE ✅ |
| **Resend** | 3,000 emails/month | $0.10 per 1000 | ~500/month = FREE ✅ |

**Total cost for 40-50 concurrent users**: **$0/month** ✅

---

## 🎉 You're All Set!

All external services are now configured. Your application has:
- ✅ Reliable PostgreSQL database (Neon)
- ✅ Fast Redis caching (Upstash)
- ✅ Optimized image hosting (Cloudinary)
- ✅ Professional email service (Resend)

**Ready to deploy?** See `DEPLOYMENT-GUIDE.md` for production deployment!
