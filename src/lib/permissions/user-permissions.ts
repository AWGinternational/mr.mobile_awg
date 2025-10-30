import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

/**
 * Check if a user can edit another user's profile
 */
export async function checkUserEditPermission(
  currentUser: { id: string; role: string },
  targetUserId: string
): Promise<boolean> {
  try {
    // Super admin can edit anyone
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return true
    }
    
    // Users can edit themselves
    if (currentUser.id === targetUserId) {
      return true
    }
    
    // Shop owners can edit their workers
    if (currentUser.role === UserRole.SHOP_OWNER) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          workerShops: {
            include: {
              shop: {
                select: {
                  ownerId: true
                }
              }
            }
          }
        }
      })
      
      if (targetUser?.workerShops) {
        // Check if current user owns any shop where target user works
        const isOwnerOfTargetWorker = targetUser.workerShops.some(
          ws => ws.shop.ownerId === currentUser.id
        )
        if (isOwnerOfTargetWorker) {
          return true
        }
      }
    }
    
    return false
  } catch (error) {
    console.error('Error checking user edit permission:', error)
    return false
  }
}

/**
 * Check if a user can change another user's status
 */
export async function checkStatusChangePermission(
  currentUser: { id: string; role: string },
  targetUserId: string
): Promise<boolean> {
  try {
    // Only super admin can change status
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      // Prevent self-deactivation
      if (currentUser.id === targetUserId) {
        return false
      }
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error checking status change permission:', error)
    return false
  }
}

/**
 * Check if a user can reset another user's password
 */
export async function checkPasswordResetPermission(
  currentUser: { id: string; role: string },
  targetUserId: string
): Promise<boolean> {
  try {
    // Super admin can reset any password
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return true
    }
    
    // Shop owners can reset their workers' passwords
    if (currentUser.role === UserRole.SHOP_OWNER) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          workerShops: {
            include: {
              shop: {
                select: {
                  ownerId: true
                }
              }
            }
          }
        }
      })
      
      if (targetUser?.workerShops) {
        const isOwnerOfTargetWorker = targetUser.workerShops.some(
          ws => ws.shop.ownerId === currentUser.id
        )
        if (isOwnerOfTargetWorker) {
          return true
        }
      }
    }
    
    return false
  } catch (error) {
    console.error('Error checking password reset permission:', error)
    return false
  }
}

/**
 * Get editable fields for a user based on permissions
 */
export function getEditableFields(
  currentUser: { id: string; role: string },
  targetUserId: string
): string[] {
  const baseFields = ['name', 'phone', 'address', 'city', 'province']
  
  // Super admin can edit everything
  if (currentUser.role === UserRole.SUPER_ADMIN) {
    return [...baseFields, 'email', 'cnic', 'businessName', 'role', 'status']
  }
  
  // Users editing themselves
  if (currentUser.id === targetUserId) {
    return [...baseFields, 'businessName'] // Can't change email, cnic, role, status
  }
  
  // Shop owners editing workers
  if (currentUser.role === UserRole.SHOP_OWNER) {
    return baseFields // Limited fields for workers
  }
  
  return []
}

/**
 * Log user management activity for audit purposes
 */
export async function logUserActivity(data: {
  userId: string
  action: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action as any,
        tableName: 'users',
        recordId: data.details.targetUserId || data.userId,
        newValues: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        createdAt: new Date()
      }
    })
  } catch (error) {
    console.error('Failed to log user activity:', error)
    // Don't throw error to avoid breaking the main operation
  }
}