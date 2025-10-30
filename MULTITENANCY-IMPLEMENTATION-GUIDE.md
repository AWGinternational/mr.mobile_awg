# 🔒 Multitenancy Implementation Guide
**Best Practices for Shop-Based Data Isolation**

---

## 📋 Overview

This guide provides best practices and code patterns for implementing shop-based multitenancy in API routes and business logic.

---

## 🎯 Core Principles

1. **Never trust client input for shopId** - Always derive from authenticated session
2. **Always filter by shopId** - Every database query must include shop filter
3. **Use centralized helpers** - Consistent shopId retrieval across all endpoints
4. **Validate shop access** - Verify user has access to requested shop
5. **Enforce unique constraints per shop** - Use composite keys where needed

---

## 🛠️ Using Auth Helpers

### **Import the Helpers**

```typescript
import { getUserShopId, requireUserShopId, verifyShopAccess } from '@/lib/auth-helpers'
```

---

## 📝 Common Patterns

### **Pattern 1: GET Endpoint - List Resources**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireUserShopId } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Get shopId from session - centralized and consistent
    const shopId = await requireUserShopId(session)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // ✅ Always filter by shopId
    const where: any = {
      shopId: shopId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ]
    }

    const resources = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: resources
    })

  } catch (error) {
    console.error('Error fetching resources:', error)
    
    if (error instanceof Error && error.message === 'No shop assigned to user') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}
```

---

### **Pattern 2: POST Endpoint - Create Resource**

```typescript
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Get shopId from session
    const shopId = await requireUserShopId(session)

    const body = await request.json()
    const { name, code, description } = body

    // Validation
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ✅ Check for duplicates within shop
    const existing = await prisma.product.findUnique({
      where: {
        code_shopId: {
          code: code,
          shopId: shopId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Product code already exists in your shop' },
        { status: 409 }
      )
    }

    // ✅ Create with shopId
    const resource = await prisma.product.create({
      data: {
        name,
        code,
        description,
        shopId: shopId // Always set shopId from session
      }
    })

    return NextResponse.json({
      success: true,
      data: resource
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating resource:', error)
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    )
  }
}
```

---

### **Pattern 3: GET Single Resource with ID**

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shopId = await requireUserShopId(session)
    const { id } = params

    // ✅ Filter by BOTH id and shopId
    const resource = await prisma.product.findFirst({
      where: {
        id: id,
        shopId: shopId
      }
    })

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: resource
    })

  } catch (error) {
    console.error('Error fetching resource:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    )
  }
}
```

---

### **Pattern 4: UPDATE with Shop Verification**

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shopId = await requireUserShopId(session)
    const { id } = params
    const body = await request.json()

    // ✅ Verify resource belongs to user's shop
    const existing = await prisma.product.findFirst({
      where: {
        id: id,
        shopId: shopId
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Resource not found or access denied' },
        { status: 404 }
      )
    }

    // ✅ Update - shopId cannot be changed
    const updated = await prisma.product.update({
      where: { id: id },
      data: {
        name: body.name,
        description: body.description
        // shopId is NOT included - it should never change
      }
    })

    return NextResponse.json({
      success: true,
      data: updated
    })

  } catch (error) {
    console.error('Error updating resource:', error)
    return NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    )
  }
}
```

---

### **Pattern 5: DELETE with Shop Verification**

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shopId = await requireUserShopId(session)
    const { id } = params

    // ✅ Verify resource belongs to user's shop before deleting
    const existing = await prisma.product.findFirst({
      where: {
        id: id,
        shopId: shopId
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Resource not found or access denied' },
        { status: 404 }
      )
    }

    // ✅ Safe to delete - verified shop ownership
    await prisma.product.delete({
      where: { id: id }
    })

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting resource:', error)
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    )
  }
}
```

---

### **Pattern 6: Transaction with Multiple Shop-Scoped Operations**

```typescript
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shopId = await requireUserShopId(session)
    const body = await request.json()

    // ✅ Use transaction to ensure all operations use same shopId
    const result = await prisma.$transaction(async (tx) => {
      // Create sale
      const sale = await tx.sale.create({
        data: {
          invoiceNumber: body.invoiceNumber,
          customerId: body.customerId,
          shopId: shopId, // ✅ Set shopId
          totalAmount: body.totalAmount,
          status: 'COMPLETED'
        }
      })

      // Create sale items
      for (const item of body.items) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }
        })

        // Update inventory (with shop filter)
        const inventoryItems = await tx.inventoryItem.findMany({
          where: {
            productId: item.productId,
            shopId: shopId, // ✅ Filter by shopId
            status: 'IN_STOCK'
          },
          take: item.quantity
        })

        await tx.inventoryItem.updateMany({
          where: {
            id: { in: inventoryItems.map(i => i.id) }
          },
          data: {
            status: 'SOLD'
          }
        })
      }

      return sale
    })

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 201 })

  } catch (error) {
    console.error('Transaction error:', error)
    return NextResponse.json(
      { error: 'Failed to complete transaction' },
      { status: 500 }
    )
  }
}
```

---

## ❌ Common Mistakes to Avoid

### **Mistake 1: Accepting shopId from Client**

```typescript
// ❌ DON'T DO THIS
const { shopId } = await request.json() // Client can manipulate this!
const products = await prisma.product.findMany({
  where: { shopId }
})

// ✅ DO THIS INSTEAD
const shopId = await requireUserShopId(session) // Derived from session
const products = await prisma.product.findMany({
  where: { shopId }
})
```

---

### **Mistake 2: Missing Shop Filter on Queries**

```typescript
// ❌ DON'T DO THIS
const product = await prisma.product.findUnique({
  where: { id: productId } // Missing shopId filter!
})

// ✅ DO THIS INSTEAD
const product = await prisma.product.findFirst({
  where: {
    id: productId,
    shopId: shopId // Always filter by shop
  }
})
```

---

### **Mistake 3: Updating shopId**

```typescript
// ❌ DON'T DO THIS
await prisma.product.update({
  where: { id: productId },
  data: {
    name: newName,
    shopId: newShopId // Never allow changing shop!
  }
})

// ✅ DO THIS INSTEAD
await prisma.product.update({
  where: { id: productId },
  data: {
    name: newName
    // shopId is immutable - never included in updates
  }
})
```

---

### **Mistake 4: Not Checking Shop Access Before Delete**

```typescript
// ❌ DON'T DO THIS
await prisma.product.delete({
  where: { id: productId } // Could delete another shop's product!
})

// ✅ DO THIS INSTEAD
const product = await prisma.product.findFirst({
  where: { id: productId, shopId: shopId }
})

if (!product) {
  throw new Error('Not found or access denied')
}

await prisma.product.delete({
  where: { id: productId }
})
```

---

## 🧪 Testing Multitenancy

### **Test Scenario 1: Cross-Shop Data Isolation**

```typescript
// Create test users in different shops
const shop1User = await createTestUser({ shopId: 'shop1' })
const shop2User = await createTestUser({ shopId: 'shop2' })

// Create product in shop1
const product1 = await createProduct(shop1User, { name: 'Product 1' })

// Try to access from shop2
const response = await fetch(`/api/products/${product1.id}`, {
  headers: { 'Authorization': `Bearer ${shop2User.token}` }
})

// Should return 404 or 403
expect(response.status).toBe(404)
```

---

### **Test Scenario 2: Same Shop Data Visibility**

```typescript
// Create two users in same shop
const owner = await createTestUser({ shopId: 'shop1', role: 'SHOP_OWNER' })
const worker = await createTestUser({ shopId: 'shop1', role: 'SHOP_WORKER' })

// Create product as owner
const product = await createProduct(owner, { name: 'Product 1' })

// Access as worker
const response = await fetch(`/api/products/${product.id}`, {
  headers: { 'Authorization': `Bearer ${worker.token}` }
})

// Should succeed and return same data
expect(response.status).toBe(200)
const data = await response.json()
expect(data.data.id).toBe(product.id)
```

---

## 📚 Summary Checklist

Before deploying any new API endpoint, verify:

- [ ] shopId is derived from session using `getUserShopId()` or `requireUserShopId()`
- [ ] All database queries include `shopId` in the `where` clause
- [ ] shopId is never accepted from client request body or query params
- [ ] Update operations do not allow changing `shopId`
- [ ] Delete operations verify shop ownership before deletion
- [ ] Transactions maintain shop isolation across all operations
- [ ] Error messages don't leak information about other shops
- [ ] Unique constraints are composite with `shopId` where needed
- [ ] Tests verify cross-shop data isolation
- [ ] Tests verify same-shop data visibility

---

## 🎯 Quick Reference

| Helper Function | Use Case | Returns |
|----------------|----------|---------|
| `getUserShopId(session)` | Get user's shop (nullable) | `string \| null` |
| `requireUserShopId(session)` | Get user's shop (required) | `string` (throws if null) |
| `verifyShopAccess(session, shopId)` | Check access to specific shop | `boolean` |
| `getUserShop(session)` | Get full shop details | `Shop \| null` |
| `getAccessibleShopIds(session)` | Get all accessible shops | `string[]` |

---

**Remember:** Multitenancy is enforced at the **database query level**. Every query must filter by shopId. No exceptions!
