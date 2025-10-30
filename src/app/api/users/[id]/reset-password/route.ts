import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { checkPasswordResetPermission, logUserActivity } from '@/lib/permissions/user-permissions'
import { generateTempPassword } from '@/utils/password-generator'
import { AuditAction } from '@/types'
import bcrypt from 'bcryptjs'
import { sendPasswordResetEmail } from '@/lib/email'

// Error response helper
function createErrorResponse(message: string, details?: any, status: number = 400) {
  return NextResponse.json({
    error: message,
    details,
    code: 'VALIDATION_ERROR',
    timestamp: new Date().toISOString()
  }, { status })
}

// Generate secure reset token
function generateResetToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36)
}

// POST /api/users/[id]/reset-password - Reset user password (Admin/Owner action)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return createErrorResponse('Unauthorized', null, 401)
    }

    // Check permission to reset password
    const canReset = await checkPasswordResetPermission(session.user, params.id)
    if (!canReset) {
      return createErrorResponse('Forbidden - You do not have permission to reset this user\'s password', null, 403)
    }

    // Get target user information
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    })

    if (!targetUser) {
      return createErrorResponse('User not found', null, 404)
    }

    // Check if user is active
    if (targetUser.status !== 'ACTIVE') {
      return createErrorResponse('Cannot reset password for inactive user', null, 400)
    }

    // Generate secure temporary password
    const temporaryPassword = generateTempPassword()
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12)

    // Update user with new password and force change flag
    await prisma.user.update({
      where: { id: params.id },
      data: {
        password: hashedPassword,
        // Add a field to force password change on next login (if it exists in schema)
        updatedAt: new Date()
      }
    })

    // Create password reset record for tracking
    const resetToken = generateResetToken()
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: AuditAction.PASSWORD_RESET,
        tableName: 'users',
        recordId: params.id,
        newValues: {
          resetBy: session.user.id,
          resetByName: session.user.name,
          resetByEmail: session.user.email,
          targetUserId: params.id,
          targetUserName: targetUser.name,
          targetUserEmail: targetUser.email,
          resetToken: resetToken,
          temporaryPassword: '***HIDDEN***', // Don't log actual password
          resetAt: new Date(),
          mustChangePassword: true
        }
      }
    })

    // Log the activity for audit purposes
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logUserActivity({
      userId: session.user.id,
      action: 'PASSWORD_RESET_PERFORMED',
      details: {
        targetUserId: params.id,
        targetUserName: targetUser.name,
        targetUserEmail: targetUser.email,
        resetToken: resetToken,
        resetReason: 'Admin/Owner initiated password reset'
      },
      ipAddress: Array.isArray(clientIP) ? clientIP[0] : clientIP,
      userAgent
    })

    // 📧 Send password reset email (async, don't wait)
    let emailSent = false
    try {
      emailSent = await sendPasswordResetEmail({
        name: targetUser.name,
        email: targetUser.email,
        tempPassword: temporaryPassword,
        resetBy: session.user.name || session.user.email || 'Administrator'
      })
    } catch (err) {
      console.error('Failed to send password reset email:', err)
      // Don't fail the request if email fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      temporaryPassword: temporaryPassword,
      resetToken: resetToken,
      userInfo: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email
      },
      instructions: {
        message: 'User must change password on next login',
        validFor: '24 hours',
        emailSent: emailSent
      }
    })

  } catch (error) {
    console.error('Failed to reset password:', error)
    
    return createErrorResponse('Internal server error', {
      message: 'Failed to reset password. Please try again.'
    }, 500)
  }
}

// GET /api/users/[id]/reset-password - Get password reset history
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

    // Check permission to view reset history
    const canView = await checkPasswordResetPermission(session.user, params.id)
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get password reset history from audit logs
    const resetHistory = await prisma.auditLog.findMany({
      where: {
        tableName: 'users',
        recordId: params.id,
        action: {
          in: ['PASSWORD_RESET', 'PASSWORD_RESET_PERFORMED']
        }
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
      resetHistory: resetHistory.map(log => ({
        id: log.id,
        action: log.action,
        resetBy: log.user.name,
        resetByEmail: log.user.email,
        resetAt: log.createdAt,
        details: {
          resetToken: (log.newValues as any)?.resetToken ? '***HIDDEN***' : null,
          reason: (log.newValues as any)?.resetReason || 'No reason provided'
        }
      }))
    })

  } catch (error) {
    console.error('Failed to get reset history:', error)
    return NextResponse.json(
      { error: 'Failed to get reset history' },
      { status: 500 }
    )
  }
}