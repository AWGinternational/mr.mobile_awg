# Multi-Tenant Migration Plan for Mobile Shop Management

## 🎯 Current State Analysis

### What You Have:
✅ **Master Database Schema**: Already has Shop model with `databaseUrl` field
✅ **User Management**: Multi-level roles (SUPER_ADMIN, SHOP_OWNER, SHOP_WORKER)
✅ **Shop Registry**: Shop model for tracking multiple shops
✅ **POS APIs**: Working single-shop APIs for cart, sales, dashboard, etc.

### What Needs Multi-Tenant Support:
❌ **Database Context**: APIs don't use shop-specific databases
❌ **Shop Routing**: No middleware to determine shop context
❌ **Data Isolation**: All data currently in single database
❌ **Frontend Context**: No shop switching in UI

## 🚀 Migration Strategy (Phased Approach)

### Phase 1: Master Database Enhancement (Week 1)
- ✅ Keep existing schema as master database
- ✅ Add shop database management
- ✅ Create shop initialization scripts

### Phase 2: Database Context Layer (Week 2)
- ✅ Create shop database connection manager
- ✅ Add middleware for shop context detection
- ✅ Create database factory for shop-specific connections

### Phase 3: API Migration (Week 3)
- ✅ Update existing POS APIs to use shop context
- ✅ Maintain backward compatibility
- ✅ Add shop-aware authentication

### Phase 4: Frontend Updates (Week 4)
- ✅ Add shop selection UI
- ✅ Update API calls with shop context
- ✅ Add shop-specific dashboards

### Phase 5: Data Migration Tools (Week 5)
- ✅ Tools to migrate existing single-shop data
- ✅ Backup and rollback procedures
- ✅ Testing and validation

## 📊 Detailed Implementation Plan

### Step 1: Enhance Master Schema (Today)
```prisma
// Enhanced Shop model
model Shop {
  id               String     @id @default(cuid())
  name             String
  code             String     @unique // Auto: SH001, SH002
  subdomain        String?    @unique // Optional: shop1.yourapp.com
  
  // Database connection
  databaseUrl      String     // Individual shop database URL
  databaseName     String     // shop_sh001_db
  isInitialized    Boolean    @default(false)
  
  // Shop-specific settings
  settings         Json       @default("{}")
  businessInfo     Json       @default("{}")
  
  // Status and ownership
  status           ShopStatus @default(ACTIVE)
  ownerId          String
  owner            User       @relation("ShopOwner", fields: [ownerId], references: [id])
  
  // Subscription and billing
  plan             String     @default("basic")
  expiresAt        DateTime?
  
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
}
```

### Step 2: Shop Database Factory
```typescript
// lib/shop-database.ts
export class ShopDatabaseManager {
  private static connections = new Map<string, PrismaClient>()
  
  static async getShopDatabase(shopId: string): Promise<PrismaClient> {
    if (this.connections.has(shopId)) {
      return this.connections.get(shopId)!
    }
    
    const shop = await masterPrisma.shop.findUnique({
      where: { id: shopId }
    })
    
    if (!shop) throw new Error('Shop not found')
    
    const shopPrisma = new PrismaClient({
      datasources: { db: { url: shop.databaseUrl } }
    })
    
    this.connections.set(shopId, shopPrisma)
    return shopPrisma
  }
}
```

### Step 3: Shop Context Middleware
```typescript
// middleware/shop-context.ts
export async function getShopContext(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')
  
  // Determine shop from:
  // 1. URL parameter (?shopId=xxx)
  // 2. User's default shop
  // 3. Subdomain (shop1.yourapp.com)
  
  const shopId = getShopIdFromRequest(request, session.user)
  const shopDB = await ShopDatabaseManager.getShopDatabase(shopId)
  
  return {
    shopId,
    shopDB,
    user: session.user,
    shop: await getShopInfo(shopId)
  }
}
```

### Step 4: Enhanced API Pattern
```typescript
// Updated POS API pattern
export async function GET(request: NextRequest) {
  try {
    const shopContext = await getShopContext(request)
    
    // Now all queries are shop-specific
    const sales = await shopContext.shopDB.sale.findMany({
      where: { status: 'COMPLETED' }
    })
    
    return NextResponse.json({ sales })
  } catch (error) {
    return handleError(error)
  }
}
```

## 🛠️ Questions for Clarification:

### 1. **Shop Identification Method**
How should shops be identified in URLs?
- Option A: `yourapp.com/api/pos/sales?shopId=sh001`
- Option B: `shop1.yourapp.com/api/pos/sales` (subdomain)
- Option C: `yourapp.com/sh001/api/pos/sales` (path-based)

### 2. **Database Strategy**
- Option A: **Single PostgreSQL server**, multiple databases (`shop_sh001_db`, `shop_sh002_db`)
- Option B: **Separate PostgreSQL instances** per shop
- Option C: **Schema-based isolation** (single DB, multiple schemas)

### 3. **Migration Timing**
- Option A: **Gradual migration** - Update APIs one by one while keeping single-shop working
- Option B: **Complete migration** - Switch entire system to multi-tenant at once
- Option C: **Parallel development** - Build multi-tenant alongside existing

### 4. **User Experience**
- Should shop owners/workers see a shop selector?
- Should super admins be able to switch between shops?
- How should the current single-shop users migrate?

## 🎯 My Recommendation:

### **Start with Option A (Gradual Migration):**

1. **Today**: Enhance master schema
2. **This Week**: Create shop database management layer
3. **Next Week**: Update one API at a time (start with dashboard)
4. **Following Week**: Update frontend components

### **Database Strategy**: Single PostgreSQL, Multiple Databases
- Easier to manage
- Better data isolation
- Scalable backup strategies
- Each shop can have different schema versions

### **URL Strategy**: Query Parameter + Middleware
- `yourapp.com/api/pos/sales?shopId=sh001`
- Easy to implement
- Backward compatible
- Can add subdomain support later

## 🚀 Ready to Start?

I can begin implementing this step by step. Shall I start with:

1. **Step 1**: Enhance the master schema with better shop management
2. **Step 2**: Create the shop database factory and context manager
3. **Step 3**: Update your POS dashboard API to be multi-tenant
4. **Step 4**: Create shop initialization and migration tools

Which step would you like me to start with?
