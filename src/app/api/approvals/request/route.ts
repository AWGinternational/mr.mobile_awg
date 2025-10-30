import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'
import { ApprovalType } from '@/generated/prisma'

/**
 * Map generic action types to Prisma ApprovalType enum
 */
function getApprovalType(action: string, tableName: string): ApprovalType {
  const normalizedTable = tableName.toUpperCase()
  const normalizedAction = action.toUpperCase()

  // Map table names to their enum prefixes
  const tableMap: { [key: string]: string } = {
    'PRODUCT': 'PRODUCT',
    'BRAND': 'PRODUCT',      // Brand operations use PRODUCT_ prefix
    'CATEGORY': 'PRODUCT',   // Category operations use PRODUCT_ prefix
    'CUSTOMER': 'CUSTOMER',
    'SUPPLIER': 'SUPPLIER',
    'INVENTORY': 'INVENTORY',
    'STOCK': 'STOCK',
    'SALE': 'SALE'           // Sale operations use SALE_ prefix
  }

  const prefix = tableMap[normalizedTable] || 'PRODUCT'

  // Map actions to enum suffixes
  if (normalizedAction === 'CREATE') {
    return `${prefix}_CREATE` as ApprovalType
  } else if (normalizedAction === 'UPDATE') {
    return `${prefix}_UPDATE` as ApprovalType
  } else if (normalizedAction === 'DELETE') {
    return `${prefix}_DELETE` as ApprovalType
  }

  // Default fallback
  return ApprovalType.PRODUCT_UPDATE
}

/**
 * POST /api/approvals/request
 * Submit a new approval request
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

    // Only workers can submit approval requests
    if (session.user.role !== UserRole.SHOP_WORKER) {
      return NextResponse.json(
        { success: false, error: 'Only workers can submit approval requests' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type, tableName, recordId, requestData, reason } = body

    // Validate required fields
    if (!type || !tableName || !requestData || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get worker's shop
    const shopWorker = await prisma.shopWorker.findFirst({
      where: {
        userId: session.user.id,
        isActive: true
      },
      select: {
        shopId: true,
        shop: {
          select: {
            ownerId: true
          }
        }
      }
    })

    if (!shopWorker) {
      return NextResponse.json(
        { success: false, error: 'Worker not found or inactive' },
        { status: 404 }
      )
    }

    // Map generic action type to Prisma enum value
    const approvalType = getApprovalType(type, tableName)

    // Create approval request
    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        type: approvalType,
        tableName,
        recordId: recordId || null,
        requestData,
        reason,
        status: 'PENDING',
        workerId: session.user.id,
        shopId: shopWorker.shopId,
        shopOwnerId: shopWorker.shop.ownerId
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        requestId: approvalRequest.id,
        message: 'Approval request submitted successfully. Your shop owner will review it soon.'
      }
    })
  } catch (error) {
    console.error('❌ Error submitting approval request:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
