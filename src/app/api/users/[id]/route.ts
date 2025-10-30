import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateUserSchema } from '@/lib/validations/user-update'
import { 
  checkUserEditPermission, 
  getEditableFields, 
  logUserActivity 
} from '@/lib/permissions/user-permissions'

// Error response helper
function createErrorResponse(message: string, details?: any, status: number = 400) {
  return NextResponse.json({
    error: message,
    details,
    code: 'VALIDATION_ERROR',
    timestamp: new Date().toISOString()
  }, { status })
}

// GET /api/users/[id] - Get user details
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

    // Check permission to view user
    const canView = await checkUserEditPermission(session.user, params.id)
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cnic: true,
        address: true,
        city: true,
        province: true,
        businessName: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        ownedShops: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true
          }
        },
        workerShops: {
          select: {
            shop: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            permissions: true,
            isActive: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get editable fields for this user
    const editableFields = getEditableFields(session.user, params.id)

    return NextResponse.json({
      user,
      editableFields,
      canEdit: canView
    })

  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user profile
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return createErrorResponse('Unauthorized', null, 401)
    }

    // Check permission to edit user
    const canEdit = await checkUserEditPermission(session.user, params.id)
    if (!canEdit) {
      return createErrorResponse('Forbidden - You do not have permission to edit this user', null, 403)
    }

    const body = await request.json()
    
    // Validate input data
    const validationResult = updateUserSchema.safeParse(body)
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      return createErrorResponse('Validation failed', fieldErrors, 400)
    }

    const validatedData = validationResult.data

    // Get current user data for comparison
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cnic: true,
        address: true,
        city: true,
        province: true,
        businessName: true,
        role: true,
        status: true
      }
    })

    if (!currentUser) {
      return createErrorResponse('User not found', null, 404)
    }

    // Get editable fields for permission checking
    const editableFields = getEditableFields(session.user, params.id)
    
    // Filter out fields that user cannot edit
    const filteredData: any = {}
    Object.keys(validatedData).forEach(key => {
      if (editableFields.includes(key) && validatedData[key as keyof typeof validatedData] !== undefined) {
        filteredData[key] = validatedData[key as keyof typeof validatedData]
      }
    })

    // Check for duplicate email or CNIC if being updated
    if (filteredData.email && filteredData.email !== currentUser.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: filteredData.email }
      })
      if (existingEmail) {
        return createErrorResponse('Email already exists', {
          field: 'email',
          message: 'A user with this email address already exists'
        }, 409)
      }
    }

    if (filteredData.cnic && filteredData.cnic !== currentUser.cnic) {
      const existingCNIC = await prisma.user.findFirst({
        where: { cnic: filteredData.cnic }
      })
      if (existingCNIC) {
        return createErrorResponse('CNIC already exists', {
          field: 'cnic',
          message: 'A user with this CNIC already exists'
        }, 409)
      }
    }

    // Update user with filtered data
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...filteredData,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cnic: true,
        address: true,
        city: true,
        province: true,
        businessName: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Log the activity for audit purposes
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logUserActivity({
      userId: session.user.id,
      action: 'USER_PROFILE_UPDATED',
      details: {
        targetUserId: params.id,
        changes: filteredData,
        previousValues: Object.keys(filteredData).reduce((prev, key) => {
          prev[key] = currentUser[key as keyof typeof currentUser]
          return prev
        }, {} as any)
      },
      ipAddress: Array.isArray(clientIP) ? clientIP[0] : clientIP,
      userAgent
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User profile updated successfully'
    })

  } catch (error) {
    console.error('Failed to update user:', error)
    
    // Handle Prisma unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('email')) {
        return createErrorResponse('Email already exists', {
          field: 'email',
          message: 'A user with this email address already exists'
        }, 409)
      }
      if (error.message.includes('cnic')) {
        return createErrorResponse('CNIC already exists', {
          field: 'cnic',
          message: 'A user with this CNIC already exists'
        }, 409)
      }
    }

    return createErrorResponse('Internal server error', {
      message: 'Failed to update user profile. Please try again.'
    }, 500)
  }
}

// DELETE /api/users/[id] - Deactivate user (soft delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return createErrorResponse('Unauthorized', null, 401)
    }

    // Only super admin can deactivate users
    if (session.user.role !== 'SUPER_ADMIN') {
      return createErrorResponse('Forbidden - Only Super Admin can deactivate users', null, 403)
    }

    // Prevent self-deactivation
    if (session.user.id === params.id) {
      return createErrorResponse('Cannot deactivate your own account', null, 400)
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!user) {
      return createErrorResponse('User not found', null, 404)
    }

    // Deactivate user instead of hard delete
    const deactivatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        status: 'INACTIVE',
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true
      }
    })

    // Log the activity
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logUserActivity({
      userId: session.user.id,
      action: 'USER_DEACTIVATED',
      details: {
        targetUserId: params.id,
        previousStatus: user.status,
        newStatus: 'INACTIVE'
      },
      ipAddress: Array.isArray(clientIP) ? clientIP[0] : clientIP,
      userAgent
    })

    return NextResponse.json({
      success: true,
      user: deactivatedUser,
      message: 'User deactivated successfully'
    })

  } catch (error) {
    console.error('Failed to deactivate user:', error)
    return createErrorResponse('Internal server error', {
      message: 'Failed to deactivate user. Please try again.'
    }, 500)
  }
}