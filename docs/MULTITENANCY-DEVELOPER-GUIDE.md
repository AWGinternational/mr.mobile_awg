# Multi-Tenancy Developer Guide

## Overview

This guide explains how to work with shop-isolated models in the Mr. Mobile POS system. All business data is isolated per shop to ensure complete tenant separation.

## Key Principles

### 1. **Always Include shopId**

Every query and mutation for shop-isolated models MUST include `shopId`:

```typescript
// ✅ CORRECT - Always filter by shopId
const products = await prisma.product.findMany({
  where: { shopId: currentShopId }
})

// ❌ WRONG - Missing shopId (security vulnerability!)
const products = await prisma.product.findMany({})
```

### 2. **Verify Shop Access**

Always verify that the current user has access to the requested shop:

```typescript
import { verifyShopAccess } from '@/lib/shop-models-helpers'

// Before any shop operation
const hasAccess = await verifyShopAccess(userId, shopId)
if (!hasAccess) {
  throw new Error('Unauthorized')
}
```

### 3. **Use Unique Constraints Properly**

Some models have composite unique constraints that include `shopId`:

#### DailyClosing: `[shopId, date]`
```typescript
// ✅ CORRECT - Use composite unique key
const closing = await prisma.dailyClosing.findUnique({
  where: {
    shopId_date: {
      shopId: 'shop-123',
      date: new Date('2025-10-12')
    }
  }
})

// ❌ WRONG - Missing shopId in unique constraint
const closing = await prisma.dailyClosing.findUnique({
  where: { date: new Date('2025-10-12') } // This won't work!
})
```

#### SalesPrediction: `[productId, predictionDate, shopId]`
```typescript
// ✅ CORRECT
const prediction = await prisma.salesPrediction.findUnique({
  where: {
    productId_predictionDate_shopId: {
      productId: 'prod-123',
      predictionDate: new Date('2025-10-15'),
      shopId: 'shop-123'
    }
  }
})
```

## Models Reference

### Shop-Isolated Models

All these models require `shopId`:

| Model | shopId Required | Unique Constraints |
|-------|----------------|-------------------|
| Category | ✅ | `[code, shopId]` |
| Brand | ✅ | `[code, shopId]`, `[name, shopId]` |
| Product | ✅ | `[sku, shopId]`, `[barcode, shopId]` |
| InventoryItem | ✅ | - |
| Supplier | ✅ | - |
| Customer | ✅ | `[phone, shopId]`, `[cnic, shopId]` |
| Sale | ✅ | - |
| CartItem | ✅ | `[userId, productId, shopId]` |
| **Purchase** | ✅ | - |
| **DailyClosing** | ✅ | `[shopId, date]` |
| **SalesPrediction** | ✅ | `[productId, predictionDate, shopId]` |
| **StockRecommendation** | ✅ | - |
| **ApprovalRequest** | ✅ | - |

## Code Examples

### Working with Purchases

```typescript
import { createPurchase, getPurchasesByShop } from '@/lib/shop-models-helpers'

// Create a purchase
const purchase = await createPurchase({
  shopId: currentShopId,
  supplierId: 'supplier-123',
  invoiceNumber: 'INV-2025-001',
  totalAmount: 50000,
  paidAmount: 30000,
  dueAmount: 20000,
  dueDate: new Date('2025-11-01'),
  items: [
    {
      productId: 'prod-123',
      quantity: 10,
      unitCost: 5000,
      totalCost: 50000
    }
  ]
})

// Get all purchases for a shop
const purchases = await getPurchasesByShop(currentShopId)
```

### Working with Daily Closings

```typescript
import { upsertDailyClosing, getDailyClosing } from '@/lib/shop-models-helpers'

// Create or update daily closing
const closing = await upsertDailyClosing({
  shopId: currentShopId,
  date: new Date(),
  totalSales: 150000,
  totalCash: 80000,
  totalCard: 50000,
  totalDigital: 20000,
  openingCash: 10000,
  closingCash: 90000,
  expectedCash: 90000,
  actualCash: 89500,
  variance: -500,
  status: 'CLOSED'
})

// Get today's closing
const todayClosing = await getDailyClosing(
  currentShopId,
  new Date()
)
```

### Working with Sales Predictions

```typescript
import { createSalesPrediction, getSalesPredictionsByShop } from '@/lib/shop-models-helpers'

// Create prediction
const prediction = await createSalesPrediction({
  shopId: currentShopId,
  productId: 'prod-123',
  predictionDate: new Date('2025-10-15'),
  predictedSales: 25,
  confidence: 0.85
})

// Get predictions for a shop
const predictions = await getSalesPredictionsByShop(
  currentShopId,
  'prod-123', // optional: specific product
  new Date('2025-10-01'), // optional: start date
  new Date('2025-10-31')  // optional: end date
)
```

### Working with Stock Recommendations

```typescript
import { createStockRecommendation, getPendingRecommendations } from '@/lib/shop-models-helpers'

// Create recommendation
const recommendation = await createStockRecommendation({
  shopId: currentShopId,
  productId: 'prod-123',
  currentStock: 5,
  recommendedQty: 20,
  reason: 'High demand forecast for next week',
  priority: 'HIGH',
  confidence: 0.9
})

// Get pending recommendations
const pending = await getPendingRecommendations(currentShopId)
```

### Working with Approval Requests

```typescript
import { 
  createApprovalRequest, 
  getPendingApprovals,
  updateApprovalStatus 
} from '@/lib/shop-models-helpers'

// Worker creates approval request
const request = await createApprovalRequest({
  shopId: currentShopId,
  workerId: session.user.id,
  shopOwnerId: shopOwner.id,
  type: 'PRODUCT_UPDATE',
  tableName: 'products',
  recordId: 'prod-123',
  requestData: {
    field: 'sellingPrice',
    oldValue: 50000,
    newValue: 55000
  },
  reason: 'Competitor pricing adjustment'
})

// Shop owner gets pending approvals
const pending = await getPendingApprovals(currentShopId)

// Shop owner approves/rejects
await updateApprovalStatus(
  request.id,
  currentShopId,
  'APPROVED',
  session.user.id
)
```

## API Route Patterns

### GET Endpoint (List)

```typescript
// GET /api/[resource]?shopId=xxx
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  const shopId = request.nextUrl.searchParams.get('shopId')
  if (!shopId) return badRequest('shopId is required')

  // Verify shop access
  await verifyShopAccess(session.user.id, shopId)

  const items = await prisma.[model].findMany({
    where: { shopId }
  })

  return NextResponse.json({ items })
}
```

### POST Endpoint (Create)

```typescript
// POST /api/[resource]
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  const body = await request.json()
  const { shopId, ...data } = body

  if (!shopId) return badRequest('shopId is required')

  // Verify shop access
  await verifyShopAccess(session.user.id, shopId)

  const item = await prisma.[model].create({
    data: {
      shopId,
      ...data
    }
  })

  return NextResponse.json({ item }, { status: 201 })
}
```

### GET Endpoint (Single Item)

```typescript
// GET /api/[resource]/[id]?shopId=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  const shopId = request.nextUrl.searchParams.get('shopId')
  if (!shopId) return badRequest('shopId is required')

  // Important: Use findFirst with shopId filter for security
  const item = await prisma.[model].findFirst({
    where: { 
      id: params.id,
      shopId // Security: Ensure item belongs to shop
    }
  })

  if (!item) return notFound()

  return NextResponse.json({ item })
}
```

## Security Checklist

Before deploying any feature that uses shop-isolated models:

- [ ] All queries include `shopId` in WHERE clause
- [ ] User's shop access is verified before operations
- [ ] Unique constraints respect `shopId` composition
- [ ] Foreign key relations maintain shop isolation
- [ ] API routes validate `shopId` parameter
- [ ] Error messages don't leak cross-tenant data
- [ ] Indexes include `shopId` for performance
- [ ] Audit logs record shop context

## Common Pitfalls

### ❌ Forgetting shopId in Updates

```typescript
// WRONG - Updates all products!
await prisma.product.updateMany({
  where: { sku: 'ABC123' },
  data: { price: 50000 }
})

// CORRECT - Updates only in specific shop
await prisma.product.updateMany({
  where: { 
    sku: 'ABC123',
    shopId: currentShopId 
  },
  data: { price: 50000 }
})
```

### ❌ Using findUnique Without Composite Key

```typescript
// WRONG - Won't work with [shopId, date] constraint
await prisma.dailyClosing.findUnique({
  where: { date: today }
})

// CORRECT - Use composite key
await prisma.dailyClosing.findUnique({
  where: {
    shopId_date: {
      shopId: currentShopId,
      date: today
    }
  }
})
```

### ❌ Missing Shop Validation

```typescript
// WRONG - No validation
const shopId = request.query.shopId
const data = await fetchData(shopId)

// CORRECT - Verify access first
const shopId = request.query.shopId
await verifyShopAccess(session.user.id, shopId)
const data = await fetchData(shopId)
```

## Testing Multi-Tenancy

Always test with multiple shops to ensure isolation:

```typescript
// Test setup
const shop1 = await createShop({ name: 'Shop 1' })
const shop2 = await createShop({ name: 'Shop 2' })

// Create data in each shop
const product1 = await createProduct({ shopId: shop1.id, sku: 'ABC' })
const product2 = await createProduct({ shopId: shop2.id, sku: 'ABC' })

// Test isolation
const shop1Products = await getProducts(shop1.id)
expect(shop1Products).toHaveLength(1)
expect(shop1Products[0].id).toBe(product1.id)

const shop2Products = await getProducts(shop2.id)
expect(shop2Products).toHaveLength(1)
expect(shop2Products[0].id).toBe(product2.id)
```

## Migration Notes

When adding new features that involve shop-isolated models:

1. Always add `shopId` field to new models
2. Add foreign key constraint to Shop table
3. Update unique constraints to include `shopId`
4. Add indexes on `[shopId, ...]` for common queries
5. Update types to include required `shopId`
6. Add shop access verification in API routes

## Further Reading

- [Multi-Tenant Architecture](../architecture/multi-tenant/MULTI-TENANT-ARCHITECTURE.md)
- [Multi-Tenancy Completion Report](../reports/completion/MULTITENANCY-COMPLETION-REPORT.md)
- [Shop Management Documentation](../reports/completion/SHOP-MANAGEMENT-COMPLETION-FINAL.md)

## Support

For questions or issues related to multi-tenancy:
- Check the completion reports in `/reports/completion/`
- Review helper functions in `/src/lib/shop-models-helpers.ts`
- See example API routes in `/src/app/api/`

