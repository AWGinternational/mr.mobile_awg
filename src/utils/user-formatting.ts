import { UserRole, UserStatus } from '@/types'

/**
 * Safely formats a user role for display, handling undefined/null values
 */
export function formatUserRole(role: UserRole | string | undefined | null): string {
  if (!role) return 'Unknown Role'
  
  return role.replace(/_/g, ' ')
}

/**
 * Safely formats a user status for display, handling undefined/null values
 */
export function formatUserStatus(status: UserStatus | undefined | null): string {
  if (!status) return 'Unknown Status'
  
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

/**
 * Gets the appropriate badge color class for a user role
 */
export function getRoleBadgeColor(role: UserRole | undefined | null): string {
  switch (role) {
    case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800'
    case 'SHOP_OWNER': return 'bg-blue-100 text-blue-800'
    case 'SHOP_WORKER': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Gets the appropriate badge color class for a user status
 */
export function getStatusBadgeColor(status: UserStatus | undefined | null): string {
  switch (status) {
    case 'ACTIVE': return 'bg-green-100 text-green-800'
    case 'INACTIVE': return 'bg-gray-100 text-gray-800'
    case 'SUSPENDED': return 'bg-red-100 text-red-800'
    case 'PENDING_VERIFICATION': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}