# 🚀 Redis Setup Guide for Mr. Mobile

## Quick Redis Setup with Upstash (Free Tier)

### Step 1: Create Free Upstash Account

1. **Visit Upstash**: Go to https://upstash.com/
2. **Sign Up**: Create free account (no credit card required)
3. **Verify Email**: Check your email and verify your account

### Step 2: Create Redis Database

1. **Dashboard**: After login, you'll see the Upstash dashboard
2. **Create Database**: Click "Create Database"
3. **Settings**:
   - **Name**: `mrmobile-dev`
   - **Region**: Choose closest to you (e.g., `us-east-1` or `eu-west-1`)
   - **Type**: Select "Regional" (Free tier)
   - **Eviction**: Keep default `allkeys-lru`
4. **Create**: Click "Create"

### Step 3: Get Connection Details

After creating the database, you'll see:
- **REST URL**: Something like `https://xxxx-yyyy-redis.upstash.io`
- **REST Token**: A long token string

### Step 4: Update Environment Variables

Copy these values and update your `.env` file:

```bash
# Redis Configuration (Upstash)
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token-here"
```

### Step 5: Test Redis Connection

Run this command to test:
```bash
npm run dev
```

You should see: `✅ Redis rate limiting enabled` in the console.

## Free Tier Limits

✅ **Upstash Free Tier**:
- **10,000 requests per day**
- **256 MB storage**
- **Regional deployment**
- **Perfect for development**

## Production Notes

For production deployment, consider:
- **Upstash Pro**: Higher limits
- **Self-hosted Redis**: On your server
- **AWS ElastiCache**: If using AWS

## Alternative: Local Redis (Optional)

If you prefer local development:

```bash
# Install Redis locally (macOS)
brew install redis
brew services start redis

# Update .env for local Redis
UPSTASH_REDIS_REST_URL="redis://localhost:6379"
UPSTASH_REDIS_REST_TOKEN=""
```

⚠️ **Note**: Our code is optimized for Upstash REST API, so local Redis would need code changes.

## Benefits of Redis Rate Limiting

✅ **Production-Ready**: Distributed rate limiting across servers
✅ **Persistent**: Limits survive server restarts  
✅ **Analytics**: Track usage patterns
✅ **Scalable**: Handle high traffic
✅ **Security**: Prevent brute force attacks

## Current Rate Limits

- **Login**: 5 attempts per 15 minutes
- **Registration**: 3 attempts per hour  
- **API Calls**: 100 requests per minute

Perfect for preventing abuse while allowing normal usage!
