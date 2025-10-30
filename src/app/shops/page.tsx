'use client'

import ShopManagementDashboard from '@/components/shop/shop-management-dashboard'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'

export default function ShopsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
      <div className="min-h-screen bg-gray-50">
        <ShopManagementDashboard />
      </div>
    </ProtectedRoute>
  )
}
