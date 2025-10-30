'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { UserRole } from '@/types'

export default function TestPage() {
  const calculateTotals = () => {
    const value1 = 10
    const value2 = 20
    
    return {
      total: value1 + value2,
      value1,
      value2
    }
  }

  const totals = calculateTotals()

  return (
    <ProtectedRoute allowedRoles={[UserRole.SHOP_OWNER, UserRole.SHOP_WORKER]}>
      <div>
        <h1>Test Page</h1>
        <p>Total: {totals.total}</p>
      </div>
    </ProtectedRoute>
  )
}
