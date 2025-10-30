import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, SystemModule, Permission } from '@/types'
import bcrypt from 'bcryptjs'

/**
 * GET /api/settings/workers
 * Fetch all workers for the current shop
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only shop owners and super admins can view workers
    if (session.user.role !== UserRole.SHOP_OWNER && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only shop owners can manage workers.' },
        { status: 403 }
      )
    }

    // Get the shop for the current owner
    let shopId: string | null = null

    if (session.user.role === UserRole.SHOP_OWNER) {
      const shop = await prisma.shop.findFirst({
        where: { ownerId: session.user.id },
        select: { id: true }
      })
      shopId = shop?.id || null
    }

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      )
    }

    // Fetch all workers for this shop
    const shopWorkers = await prisma.shopWorker.findMany({
      where: { shopId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    })

    // Fetch module access permissions for each worker
    const workersWithPermissions = await Promise.all(
      shopWorkers.map(async (shopWorker) => {
        const moduleAccess = await prisma.shopWorkerModuleAccess.findMany({
          where: {
            shopId,
            workerId: shopWorker.userId,
            isEnabled: true
          }
        })

        // Group permissions by module
        const permissions = moduleAccess.reduce((acc, access) => {
          acc[access.module] = access.permissions as string[]
          return acc
        }, {} as { [key: string]: string[] })

        return {
          id: shopWorker.userId,
          name: shopWorker.user.name,
          email: shopWorker.user.email,
          phone: shopWorker.user.phone,
          joinedAt: shopWorker.joinedAt.toISOString(),
          isActive: shopWorker.isActive,
          permissions
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        workers: workersWithPermissions
      }
    })
  } catch (error) {
    console.error('❌ Error fetching workers:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/workers
 * Create a new worker for the current shop
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only shop owners can add workers
    if (session.user.role !== UserRole.SHOP_OWNER) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only shop owners can add workers.' },
        { status: 403 }
      )
    }

    // Get the shop for the current owner
    const shop = await prisma.shop.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true, name: true }
    })

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      )
    }

    const shopId = shop.id

    // Check current worker count (maximum 2 workers per shop)
    const workerCount = await prisma.shopWorker.count({
      where: { shopId }
    })

    if (workerCount >= 2) {
      return NextResponse.json(
        { success: false, error: 'Maximum 2 workers allowed per shop. Please remove an existing worker first.' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, email, phone, password } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and worker in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with SHOP_WORKER role
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          password: hashedPassword,
          role: UserRole.SHOP_WORKER
        }
      })

      // Create ShopWorker link
      const shopWorker = await tx.shopWorker.create({
        data: {
          shopId,
          userId: newUser.id,
          permissions: {},
          isActive: true
        }
      })

      // Create default permissions (basic POS access)
      const defaultPermissions = [
        {
          shopId,
          workerId: newUser.id,
          module: SystemModule.POS_SYSTEM as any,
          permissions: [Permission.VIEW, Permission.CREATE] as any,
          isEnabled: true
        },
        {
          shopId,
          workerId: newUser.id,
          module: SystemModule.PRODUCT_MANAGEMENT as any,
          permissions: [Permission.VIEW] as any,
          isEnabled: true
        },
        {
          shopId,
          workerId: newUser.id,
          module: SystemModule.SALES_REPORTS as any,
          permissions: [Permission.VIEW] as any,
          isEnabled: true
        }
      ]

      await tx.shopWorkerModuleAccess.createMany({
        data: defaultPermissions
      })

      return { user: newUser, shopWorker }
    })

    console.log(`✅ Worker created successfully: ${result.user.email} for shop ${shop.name}`)

    return NextResponse.json({
      success: true,
      message: 'Worker added successfully',
      data: {
        worker: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          joinedAt: result.shopWorker.joinedAt.toISOString(),
          isActive: result.shopWorker.isActive
        }
      }
    })
  } catch (error) {
    console.error('❌ Error creating worker:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create worker. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/settings/workers
 * Toggle worker active status (activate/deactivate)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only shop owners can manage workers
    if (session.user.role !== UserRole.SHOP_OWNER) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only shop owners can manage workers.' },
        { status: 403 }
      )
    }

    // Get the shop for the current owner
    const shop = await prisma.shop.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true }
    })

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      )
    }

    const { workerId, isActive } = await request.json()

    if (!workerId) {
      return NextResponse.json(
        { success: false, error: 'Worker ID is required' },
        { status: 400 }
      )
    }

    // Update worker status
    const updatedWorker = await prisma.shopWorker.updateMany({
      where: {
        shopId: shop.id,
        userId: workerId
      },
      data: {
        isActive
      }
    })

    if (updatedWorker.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Worker not found in your shop' },
        { status: 404 }
      )
    }

    console.log(`✅ Worker ${isActive ? 'activated' : 'deactivated'}: ${workerId}`)

    return NextResponse.json({
      success: true,
      message: `Worker ${isActive ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    console.error('❌ Error updating worker status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update worker status' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/settings/workers
 * Permanently delete a worker
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only shop owners can delete workers
    if (session.user.role !== UserRole.SHOP_OWNER) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only shop owners can delete workers.' },
        { status: 403 }
      )
    }

    // Get the shop for the current owner
    const shop = await prisma.shop.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true }
    })

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('workerId')

    if (!workerId) {
      return NextResponse.json(
        { success: false, error: 'Worker ID is required' },
        { status: 400 }
      )
    }

    // Delete worker and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete worker permissions
      await tx.shopWorkerModuleAccess.deleteMany({
        where: {
          shopId: shop.id,
          workerId
        }
      })

      // Delete shop worker link
      await tx.shopWorker.deleteMany({
        where: {
          shopId: shop.id,
          userId: workerId
        }
      })

      // Delete the user account
      await tx.user.delete({
        where: { id: workerId }
      })
    })

    console.log(`✅ Worker permanently deleted: ${workerId}`)

    return NextResponse.json({
      success: true,
      message: 'Worker deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting worker:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete worker' },
      { status: 500 }
    )
  }
}
