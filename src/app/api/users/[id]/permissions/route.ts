import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole, SystemModule, Permission } from '@/types'
import { z } from 'zod'

const permissionsSchema = z.object({
  permissions: z.array(z.object({
    module: z.nativeEnum(SystemModule),
    permissions: z.array(z.nativeEnum(Permission))
  }))
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN and SHOP_OWNER can view permissions
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.SHOP_OWNER) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get user's module access
    const userModuleAccess = await prisma.userModuleAccess.findMany({
      where: { userId: params.id }
    })

    // Transform to the format expected by the frontend
    const permissions = userModuleAccess.map(access => ({
      module: access.module,
      permissions: access.permissions
    }))

    return NextResponse.json({
      success: true,
      permissions
    })
  } catch (error) {
    console.error('Permission fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN and SHOP_OWNER can modify permissions
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.SHOP_OWNER) {
      return NextResponse.json(
        { error: 'Only Super Admins and Shop Owners can modify permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = permissionsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const { permissions } = validation.data

    // Get user to verify they exist and are a worker
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role !== UserRole.SHOP_WORKER) {
      return NextResponse.json(
        { error: 'Permissions can only be set for shop workers' },
        { status: 400 }
      )
    }

    // If shop owner, verify the worker belongs to their shop
    if (session.user.role === UserRole.SHOP_OWNER) {
      const workerShops = await prisma.shop.findMany({
        where: {
          ownerId: session.user.id,
          workers: {
            some: {
              id: params.id
            }
          }
        }
      })

      if (workerShops.length === 0) {
        return NextResponse.json(
          { error: 'You can only modify permissions for your own workers' },
          { status: 403 }
        )
      }
    }

    // Delete existing permissions
    await prisma.userModuleAccess.deleteMany({
      where: { userId: params.id }
    })

    // Create new permissions
    if (permissions.length > 0) {
      await prisma.userModuleAccess.createMany({
        data: permissions.map(perm => ({
          userId: params.id,
          module: perm.module as any,
          permissions: perm.permissions as any
        }))
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully'
    })
  } catch (error) {
    console.error('Permission update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

