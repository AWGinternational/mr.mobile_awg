import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, AuditAction } from '@/types'
import { z } from 'zod'

const roleChangeSchema = z.object({
  role: z.nativeEnum(UserRole),
  reason: z.string()
    .max(500, 'Reason must be less than 500 characters')
    .optional()
    .default('')
})

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can change roles
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Only Super Admins can change user roles' },
        { status: 403 }
      )
    }

    const params = await context.params
    const body = await request.json()
    const validation = roleChangeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const { role, reason } = validation.data

    // Prevent changing own role
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      )
    }

    // Get user to verify they exist
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        role: role as UserRole,
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: AuditAction.UPDATE,
        tableName: 'User',
        recordId: params.id,
        oldValues: {
          role: user.role
        },
        newValues: {
          role: role,
          reason: reason || 'No reason provided',
          changedBy: session.user.name,
          changedAt: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User role changed successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Role change error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

