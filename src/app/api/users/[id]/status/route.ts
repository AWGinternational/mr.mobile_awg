import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { statusChangeSchema } from '@/lib/validations/user-update'
import { 
  checkStatusChangePermission, 
  logUserActivity 
} from '@/lib/permissions/user-permissions'
import { UserStatus } from '@/types'

// Error response helper
function createErrorResponse(message: string, details?: any, status: number = 400) {
  return NextResponse.json({
    error: message,
    details,
    code: 'VALIDATION_ERROR',
    timestamp: new Date().toISOString()
  }, { status })
}

// PATCH /api/users/[id]/status - Change user status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return createErrorResponse('Unauthorized', null, 401)
    }

    // Check permission to change user status
    const canChangeStatus = await checkStatusChangePermission(session.user, params.id)
    if (!canChangeStatus) {
      return createErrorResponse('Forbidden - You do not have permission to change user status', null, 403)
    }

    const body = await request.json()
    
    // Validate input data
    const validationResult = statusChangeSchema.safeParse(body)
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      return createErrorResponse('Validation failed', fieldErrors, 400)
    }

    const { status, reason } = validationResult.data

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        ownedShops: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!currentUser) {
      return createErrorResponse('User not found', null, 404)
    }

    // Prevent self-deactivation
    if (session.user.id === params.id && status !== 'ACTIVE') {
      return createErrorResponse('Cannot deactivate your own account', null, 400)
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        status: status as UserStatus,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Handle cascading effects for shop owners
    if (status === 'INACTIVE' && currentUser.role === 'SHOP_OWNER' && currentUser.ownedShops.length > 0) {
      // Deactivate all workers in owned shops
      const shopIds = currentUser.ownedShops.map(shop => shop.id)
      
      await prisma.user.updateMany({
        where: {
          role: 'SHOP_WORKER',
          workerShops: {
            some: {
              shopId: {
                in: shopIds
              }
            }
          }
        },
        data: {
          status: 'INACTIVE',
          updatedAt: new Date()
        }
      })

      // Also deactivate the shops
      await prisma.shop.updateMany({
        where: {
          id: {
            in: shopIds
          }
        },
        data: {
          status: 'INACTIVE',
          updatedAt: new Date()
        }
      })
    }

    // Log the activity for audit purposes
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logUserActivity({
      userId: session.user.id,
      action: 'USER_STATUS_CHANGED',
      details: {
        targetUserId: params.id,
        targetUserName: currentUser.name,
        targetUserEmail: currentUser.email,
        previousStatus: currentUser.status,
        newStatus: status,
        reason: reason || 'No reason provided',
        cascadingEffects: currentUser.role === 'SHOP_OWNER' && status === 'INACTIVE' ? {
          shopsDeactivated: currentUser.ownedShops.length,
          shopNames: currentUser.ownedShops.map(shop => shop.name)
        } : null
      },
      ipAddress: Array.isArray(clientIP) ? clientIP[0] : clientIP,
      userAgent
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User status changed to ${status} successfully`,
      cascadingEffects: currentUser.role === 'SHOP_OWNER' && status === 'INACTIVE' ? {
        message: `Also deactivated ${currentUser.ownedShops.length} owned shops and their workers`,
        affectedShops: currentUser.ownedShops.map(shop => shop.name)
      } : null
    })

  } catch (error) {
    console.error('Failed to change user status:', error)
    
    return createErrorResponse('Internal server error', {
      message: 'Failed to change user status. Please try again.'
    }, 500)
  }
}

// GET /api/users/[id]/status - Get user status history (future enhancement)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, just return current status
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get recent status change activities from audit log
    const statusHistory = await prisma.auditLog.findMany({
      where: {
        tableName: 'users',
        recordId: params.id,
        action: 'USER_STATUS_CHANGED'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        action: true,
        newValues: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      currentStatus: user.status,
      lastUpdated: user.updatedAt,
      history: statusHistory
    })

  } catch (error) {
    console.error('Failed to get user status:', error)
    return NextResponse.json(
      { error: 'Failed to get user status' },
      { status: 500 }
    )
  }
}