import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { AuditAction } from '@/types'
import { z } from 'zod'

// Validation schema for shop updates
const updateShopSchema = z.object({
  name: z.string().min(3, 'Shop name must be at least 3 characters').optional(),
  address: z.string().min(10, 'Address must be at least 10 characters').optional(),
  city: z.string().min(2, 'City is required').optional(),
  province: z.string().min(2, 'Province is required').optional(),
  postalCode: z.string().regex(/^\d{4,6}$/, 'Postal code must be 4-6 digits').optional(),
  phone: z.string().regex(/^(\+92|0)?[-\s]?\d{2,3}[-\s]?\d{7,8}$/, 'Invalid Pakistani phone format').optional(),
  email: z.string().email('Invalid email address').optional(),
  licenseNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  settings: z.object({
    currency: z.string().optional(),
    timezone: z.string().optional(),
    gstRate: z.number().min(0).max(100).optional(),
    maxWorkers: z.number().min(1).max(10).optional(),
    businessHours: z.object({
      open: z.string().regex(/^\d{2}:\d{2}$/, 'Time format must be HH:MM').optional(),
      close: z.string().regex(/^\d{2}:\d{2}$/, 'Time format must be HH:MM').optional(),
      days: z.array(z.string()).min(1, 'At least one business day required').optional()
    }).optional()
  }).optional()
})

// GET /api/shops/[id] - Get shop details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const shopId = params.id

    // Build access control based on user role
    let whereClause: any = { id: shopId }

    if (session.user.role === 'SHOP_OWNER') {
      whereClause.ownerId = session.user.id
    } else if (session.user.role === 'SHOP_WORKER') {
      // Check if worker is assigned to this shop
      const workerAssignment = await prisma.shopWorker.findFirst({
        where: {
          userId: session.user.id,
          shopId: shopId,
          isActive: true
        }
      })

      if (!workerAssignment) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const shop = await prisma.shop.findFirst({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            businessName: true,
            businessRegNo: true
          }
        },
        workers: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true
              }
            }
          },
          orderBy: { id: 'desc' }
        },
        _count: {
          select: {
            workers: {
              where: { isActive: true }
            }
          }
        }
      }
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    return NextResponse.json(shop)

  } catch (error) {
    console.error('Failed to fetch shop:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shop' },
      { status: 500 }
    )
  }
}

// PUT /api/shops/[id] - Update shop details
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const shopId = params.id

    // Check access permissions
    if (session.user.role === 'SHOP_WORKER') {
      return NextResponse.json({ error: 'Access denied. Workers cannot update shop details.' }, { status: 403 })
    }

    // Get current shop for validation and audit
    let whereClause: any = { id: shopId }
    if (session.user.role === 'SHOP_OWNER') {
      whereClause.ownerId = session.user.id
    }

    const currentShop = await prisma.shop.findFirst({
      where: whereClause
    })

    if (!currentShop) {
      return NextResponse.json({ error: 'Shop not found or access denied' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateShopSchema.parse(body)

    // Update the shop
    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: validatedData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            businessName: true
          }
        }
      }
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      tableName: 'shops',
      recordId: shopId,
      oldValues: {
        name: currentShop.name,
        address: currentShop.address,
        status: currentShop.status,
        settings: currentShop.settings
      },
      newValues: validatedData
    })

    return NextResponse.json(updatedShop)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Failed to update shop:', error)
    return NextResponse.json(
      { error: 'Failed to update shop' },
      { status: 500 }
    )
  }
}

// DELETE /api/shops/[id] - Delete/Deactivate shop (Super Admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied. Super Admin required.' }, { status: 403 })
    }

    const params = await context.params
    const shopId = params.id

    // Get shop for audit trail
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        owner: { select: { name: true, email: true } },
        workers: {
          where: { isActive: true },
          select: {
            id: true,
            user: { select: { id: true, name: true } }
          }
        }
      }
    })

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Check if shop has active workers
    if (shop.workers.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete shop with active workers. Please deactivate workers first.' },
        { status: 400 }
      )
    }

    // Soft delete by setting status to INACTIVE
    const deactivatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: { 
        status: 'INACTIVE',
        updatedAt: new Date()
      }
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.DELETE,
      tableName: 'shops',
      recordId: shopId,
      oldValues: {
        name: shop.name,
        status: shop.status,
        ownerName: shop.owner.name
      },
      newValues: {
        status: 'INACTIVE',
        deactivatedAt: new Date().toISOString()
      }
    })

    return NextResponse.json({ 
      message: 'Shop deactivated successfully',
      shop: deactivatedShop 
    })

  } catch (error) {
    console.error('Failed to delete shop:', error)
    return NextResponse.json(
      { error: 'Failed to delete shop' },
      { status: 500 }
    )
  }
}
