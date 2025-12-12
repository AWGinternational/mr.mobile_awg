# 🚀 Performance Optimization Guide (Free Tier)

## Current Issue
- **Latency**: 3-4 seconds per page load
- **Stack**: Free Vercel + Free Supabase
- **Root Causes**: 
  - Database cold starts (Supabase pauses after inactivity)
  - No connection pooling on direct connection
  - Sequential database queries
  - Geographic latency
  - Missing caching layer

---

## ✅ Immediate Fixes (Zero Cost)

### 1. Enable Supabase Connection Pooler (FREE)

**In Vercel Environment Variables, update:**

```bash
# Current (Direct Connection - SLOW)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres

# Change to (Pooled Connection - FAST)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:6543/postgres?pgbouncer=true

# Keep Direct URL for migrations
DIRECT_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres
```

**Benefits:**
- ✅ Reuses connections instead of creating new ones
- ✅ Reduces cold start impact
- ✅ **Improves latency by 50-70%**
- ✅ Available on FREE tier

**How to get your connection strings:**
1. Go to Supabase Dashboard → Project Settings → Database
2. Look for "Connection string" section
3. Use **"Connection pooling"** string (port 6543) for `DATABASE_URL`
4. Use **"Direct connection"** string (port 5432) for `DIRECT_URL`

---

### 2. Implement React Query Caching

**Already installed:** Check if `@tanstack/react-query` is in dependencies

Add this configuration:

```typescript
// src/lib/react-query.ts (CREATE THIS FILE)
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is "fresh" for 5 min
      cacheTime: 10 * 60 * 1000, // 10 minutes - keep in cache
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      refetchOnMount: false, // Don't refetch on component mount if cached
      retry: 1, // Only retry once on failure
    },
  },
});
```

**Update your layout to use query client:**

```typescript
// src/app/layout.tsx (UPDATE)
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

**Benefits:**
- ✅ Avoid redundant API calls
- ✅ Instant page loads for cached data
- ✅ **Reduces latency by 80-90%** on repeat visits

---

### 3. Optimize Database Queries (CRITICAL)

**Example: Dashboard page likely does this:**

```typescript
// ❌ BAD: Sequential queries (3-4 seconds)
const products = await prisma.product.findMany({ where: { shopId } });
const categories = await prisma.category.findMany({ where: { shopId } });
const sales = await prisma.sale.findMany({ where: { shopId } });
const brands = await prisma.brand.findMany({ where: { shopId } });
```

**Change to:**

```typescript
// ✅ GOOD: Parallel queries (1 second)
const [products, categories, sales, brands] = await Promise.all([
  prisma.product.findMany({ where: { shopId } }),
  prisma.category.findMany({ where: { shopId } }),
  prisma.sale.findMany({ where: { shopId } }),
  prisma.brand.findMany({ where: { shopId } }),
]);
```

**Benefits:**
- ✅ Queries run in parallel
- ✅ **Reduces latency by 60-75%**
- ✅ No cost, just code change

---

### 4. Add Database Indexes (FREE)

Check which queries are slow in Supabase Dashboard → Database → Query Performance

**Add indexes for common queries:**

```prisma
// prisma/schema.prisma (UPDATE)

model Product {
  id          String   @id @default(cuid())
  shopId      String
  name        String
  brandId     String?
  categoryId  String?
  status      String
  createdAt   DateTime @default(now())
  
  @@index([shopId, status]) // For filtering by shop and status
  @@index([shopId, brandId]) // For filtering by brand
  @@index([shopId, categoryId]) // For filtering by category
  @@index([createdAt]) // For sorting by date
  shop        Shop     @relation(fields: [shopId], references: [id])
}

model Sale {
  id          String   @id @default(cuid())
  shopId      String
  createdAt   DateTime @default(now())
  status      String
  
  @@index([shopId, createdAt]) // For dashboard sales queries
  @@index([shopId, status]) // For filtering by status
  shop        Shop     @relation(fields: [shopId], references: [id])
}
```

**After adding indexes:**
```bash
npx prisma migrate dev --name add_performance_indexes
npx prisma generate
git add . && git commit -m "perf: Add database indexes for common queries"
git push
```

**Benefits:**
- ✅ Faster query execution
- ✅ **Reduces latency by 30-50%**
- ✅ Free on Supabase

---

### 5. Enable Next.js Static Generation

**For pages that don't change often:**

```typescript
// src/app/products/page.tsx (UPDATE)
export const revalidate = 300; // Revalidate every 5 minutes

export default async function ProductsPage() {
  // Your existing code
}
```

**Benefits:**
- ✅ Page is pre-rendered at build time
- ✅ Served from CDN (instant load)
- ✅ **Reduces latency to ~100ms**
- ✅ Free on Vercel

---

## 🎯 Expected Results After Optimization

| Optimization | Current | After | Improvement |
|--------------|---------|-------|-------------|
| Connection Pooler | 3-4s | 1-1.5s | **70%** |
| + Parallel Queries | 1-1.5s | 600-800ms | **50%** |
| + React Query Cache | 600-800ms | 50-100ms | **90%** (cached) |
| + Database Indexes | 600-800ms | 400-600ms | **30%** |
| + Static Pages | 600-800ms | 100-200ms | **80%** |

**Total Improvement: 3-4s → 100-600ms (80-95% faster!)**

---

## 📋 Implementation Checklist

### Step 1: Connection Pooler (5 minutes)
- [ ] Get pooled connection string from Supabase (port 6543)
- [ ] Update `DATABASE_URL` in Vercel environment variables
- [ ] Redeploy: `git commit --allow-empty -m "chore: Trigger redeploy" && git push`
- [ ] Test: Load any page, check Network tab

### Step 2: Add Indexes (10 minutes)
- [ ] Add `@@index` to your Prisma schema (see above)
- [ ] Run `npx prisma migrate dev --name add_indexes`
- [ ] Push to production

### Step 3: Optimize Queries (20 minutes)
- [ ] Find pages with multiple `await prisma` calls
- [ ] Wrap in `Promise.all([...])`
- [ ] Test locally, then deploy

### Step 4: React Query (15 minutes)
- [ ] Create `src/lib/react-query.ts`
- [ ] Update root layout
- [ ] Test caching behavior

### Step 5: Static Pages (5 minutes)
- [ ] Add `export const revalidate = 300` to static pages
- [ ] Redeploy

---

## 🔍 Monitoring & Debugging

### Check Current Connection Type:
```bash
# In Vercel logs, look for:
"Connection established to [PROJECT].supabase.co:6543" # ✅ Pooled
"Connection established to [PROJECT].supabase.co:5432" # ❌ Direct
```

### Measure Page Load Time:
```javascript
// Add to page component temporarily
console.time('page-load');
// Your data fetching code
console.timeEnd('page-load'); // Should show < 1s after optimization
```

### Supabase Query Performance:
1. Go to Supabase Dashboard → Database → Query Performance
2. Check "Slowest Queries"
3. Add indexes for slow queries

---

## 🚨 Common Mistakes to Avoid

1. **Using Direct URL for app** ❌
   - Direct URL is ONLY for migrations
   - Always use pooled URL (port 6543) for app

2. **Sequential queries** ❌
   - Avoid multiple `await` statements in sequence
   - Use `Promise.all()` for parallel queries

3. **No caching** ❌
   - React Query prevents redundant API calls
   - Set appropriate `staleTime` values

4. **Missing indexes** ❌
   - Every `WHERE` clause should have an index
   - Check Supabase query performance regularly

---

## 🎁 Bonus: Keep Database Warm

Supabase free tier pauses after **1 hour of inactivity**. To prevent this:

**Option 1: Vercel Cron Job (FREE)**

```typescript
// src/app/api/cron/keep-warm/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Simple query to keep DB warm
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'warm', timestamp: new Date() });
  } catch (error) {
    return NextResponse.json({ status: 'error', error }, { status: 500 });
  }
}
```

**In `vercel.json`:**

```json
{
  "crons": [
    {
      "path": "/api/cron/keep-warm",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Option 2: UptimeRobot (FREE)**

1. Sign up at uptimerobot.com (free)
2. Create HTTP monitor: `https://your-app.vercel.app/api/health`
3. Set interval: Every 30 minutes
4. Keeps DB and app warm

---

## 🆘 If Still Slow After All Optimizations

### Geographic Latency Issues:
- Check Supabase project region (should be closest to your users)
- Check Vercel deployment region (should match Supabase)
- Consider: Supabase read replicas (paid) or Cloudflare Workers (edge caching)

### Database Size Issues:
- Free tier has 500MB limit
- Check: Supabase Dashboard → Database → Size
- Solution: Archive old data, optimize images

### Need More Help:
- Run: `npx prisma debug` to check connection issues
- Check Vercel logs for slow API routes
- Use Next.js Speed Insights (free on Vercel)

---

## 📊 Success Metrics

After implementing all optimizations, you should see:

- **First Load**: 400-800ms (was 3-4s) ✅
- **Cached Load**: 50-100ms (instant!) ✅
- **Database Queries**: < 200ms each ✅
- **Vercel Function Duration**: < 1s ✅

**Total Cost: $0** 🎉
