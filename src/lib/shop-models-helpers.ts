/**
 * Shop Model Helpers - Multi-Tenancy Support
 * 
 * Helper functions for working with shop-isolated models that require shopId.
 * All functions ensure proper shop isolation to prevent data leakage.
 */

import { prisma } from '@/lib/db'

// ============================================
// PURCHASE HELPERS
// ============================================

/**
 * Create a new purchase for a shop
 */
export async function createPurchase(data: {
  shopId: string
  supplierId: string
  invoiceNumber: string
  totalAmount: number
  paidAmount?: number
  dueAmount: number
  dueDate?: Date
  status?: string
  items: Array<{
    productId: string
    quantity: number
    unitCost: number
    totalCost: number
  }>
}) {
  return await prisma.purchase.create({
    data: {
      shopId: data.shopId,
      supplierId: data.supplierId,
      invoiceNumber: data.invoiceNumber,
      totalAmount: data.totalAmount,
      paidAmount: data.paidAmount || 0,
      dueAmount: data.dueAmount,
      dueDate: data.dueDate,
      status: data.status || ('PENDING' as any),
      items: {
        create: data.items
      }
    },
    include: {
      items: true,
      supplier: true
    }
  })
}

/**
 * Get all purchases for a shop
 */
export async function getPurchasesByShop(shopId: string) {
  return await prisma.purchase.findMany({
    where: { shopId },
    include: {
      supplier: true,
      items: {
        include: {
          // Note: productId doesn't have direct relation in PurchaseItem
          // You may need to add this relation in schema
        }
      }
    },
    orderBy: { purchaseDate: 'desc' }
  })
}

/**
 * Get a single purchase (with shop isolation check)
 */
export async function getPurchaseById(id: string, shopId: string) {
  return await prisma.purchase.findFirst({
    where: { 
      id,
      shopId // Security: Ensure purchase belongs to the shop
    },
    include: {
      supplier: true,
      items: true
    }
  })
}

// ============================================
// DAILY CLOSING HELPERS
// ============================================

/**
 * Create or update daily closing for a shop
 * Note: Uses unique constraint [shopId, date]
 */
export async function upsertDailyClosing(data: {
  shopId: string
  date: Date
  totalSales?: number
  totalCash?: number
  totalCard?: number
  totalDigital?: number
  openingCash?: number
  closingCash?: number
  cashDeposited?: number
  totalExpenses?: number
  expectedCash?: number
  actualCash?: number
  variance?: number
  notes?: string
  status?: 'OPEN' | 'CLOSED' | 'RECONCILED'
}) {
  return await prisma.dailyClosing.upsert({
    where: {
      shopId_date: {
        shopId: data.shopId,
        date: data.date
      }
    },
    create: {
      shopId: data.shopId,
      date: data.date,
      status: data.status || 'OPEN',
      totalSales: data.totalSales || 0,
      totalCash: data.totalCash || 0,
      totalCard: data.totalCard || 0,
      totalDigital: data.totalDigital || 0,
      openingCash: data.openingCash || 0,
      closingCash: data.closingCash || 0,
      cashDeposited: data.cashDeposited || 0,
      totalExpenses: data.totalExpenses || 0,
      expectedCash: data.expectedCash || 0,
      actualCash: data.actualCash || 0,
      variance: data.variance || 0,
      notes: data.notes
    },
    update: {
      status: data.status,
      totalSales: data.totalSales,
      totalCash: data.totalCash,
      totalCard: data.totalCard,
      totalDigital: data.totalDigital,
      closingCash: data.closingCash,
      cashDeposited: data.cashDeposited,
      totalExpenses: data.totalExpenses,
      actualCash: data.actualCash,
      variance: data.variance,
      notes: data.notes,
      closedAt: data.status === 'CLOSED' ? new Date() : undefined
    }
  })
}

/**
 * Get daily closing for a specific shop and date
 */
export async function getDailyClosing(shopId: string, date: Date) {
  return await prisma.dailyClosing.findUnique({
    where: {
      shopId_date: {
        shopId,
        date
      }
    },
    include: {
      expenses: true
    }
  })
}

/**
 * Get all daily closings for a shop within a date range
 */
export async function getDailyClosingsByShop(
  shopId: string,
  startDate?: Date,
  endDate?: Date
) {
  return await prisma.dailyClosing.findMany({
    where: {
      shopId,
      ...(startDate || endDate ? {
        date: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate })
        }
      } : {})
    },
    include: {
      expenses: true
    },
    orderBy: { date: 'desc' }
  })
}

// ============================================
// SALES PREDICTION HELPERS
// ============================================

/**
 * Create sales prediction for a product in a shop
 */
export async function createSalesPrediction(data: {
  shopId: string
  productId: string
  predictionDate: Date
  predictedSales: number
  confidence: number
  actualSales?: number
  accuracy?: number
}) {
  return await prisma.salesPrediction.create({
    data: {
      shopId: data.shopId,
      productId: data.productId,
      predictionDate: data.predictionDate,
      predictedSales: data.predictedSales,
      confidence: data.confidence,
      actualSales: data.actualSales,
      accuracy: data.accuracy
    }
  })
}

/**
 * Get sales predictions for a shop
 */
export async function getSalesPredictionsByShop(
  shopId: string,
  productId?: string,
  startDate?: Date,
  endDate?: Date
) {
  return await prisma.salesPrediction.findMany({
    where: {
      shopId,
      ...(productId && { productId }),
      ...(startDate || endDate ? {
        predictionDate: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate })
        }
      } : {})
    },
    orderBy: { predictionDate: 'desc' }
  })
}

/**
 * Update actual sales and accuracy for a prediction
 */
export async function updateSalesPredictionActuals(
  shopId: string,
  productId: string,
  predictionDate: Date,
  actualSales: number
) {
  const prediction = await prisma.salesPrediction.findUnique({
    where: {
      productId_predictionDate_shopId: {
        shopId,
        productId,
        predictionDate
      }
    }
  })

  if (!prediction) {
    throw new Error('Prediction not found')
  }

  const accuracy = 1 - Math.abs(prediction.predictedSales - actualSales) / prediction.predictedSales

  return await prisma.salesPrediction.update({
    where: {
      productId_predictionDate_shopId: {
        shopId,
        productId,
        predictionDate
      }
    },
    data: {
      actualSales,
      accuracy
    }
  })
}

// ============================================
// STOCK RECOMMENDATION HELPERS
// ============================================

/**
 * Create stock recommendation for a product in a shop
 */
export async function createStockRecommendation(data: {
  shopId: string
  productId: string
  currentStock: number
  recommendedQty: number
  reason: string
  priority: string
  confidence: number
}) {
  return await prisma.stockRecommendation.create({
    data: {
      shopId: data.shopId,
      productId: data.productId,
      currentStock: data.currentStock,
      recommendedQty: data.recommendedQty,
      reason: data.reason,
      priority: data.priority,
      confidence: data.confidence,
      isProcessed: false
    }
  })
}

/**
 * Get unprocessed stock recommendations for a shop
 */
export async function getPendingRecommendations(shopId: string) {
  return await prisma.stockRecommendation.findMany({
    where: {
      shopId,
      isProcessed: false
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ]
  })
}

/**
 * Mark recommendation as processed
 */
export async function markRecommendationProcessed(id: string, shopId: string) {
  return await prisma.stockRecommendation.updateMany({
    where: { 
      id,
      shopId // Security: Ensure recommendation belongs to the shop
    },
    data: {
      isProcessed: true
    }
  })
}

// ============================================
// APPROVAL REQUEST HELPERS
// ============================================

/**
 * Create approval request for a shop
 */
export async function createApprovalRequest(data: {
  shopId: string
  workerId: string
  shopOwnerId: string
  type: 'PRODUCT_UPDATE' | 'PRODUCT_DELETE' | 'INVENTORY_UPDATE' | 'SALE_MODIFICATION' | 'CUSTOMER_UPDATE'
  tableName: string
  recordId: string
  requestData: any
  reason?: string
}) {
  return await prisma.approvalRequest.create({
    data: {
      shopId: data.shopId,
      workerId: data.workerId,
      shopOwnerId: data.shopOwnerId,
      type: data.type,
      tableName: data.tableName,
      recordId: data.recordId,
      requestData: data.requestData,
      reason: data.reason,
      status: 'PENDING'
    }
  })
}

/**
 * Get pending approval requests for a shop owner
 */
export async function getPendingApprovals(shopId: string, shopOwnerId?: string) {
  return await prisma.approvalRequest.findMany({
    where: {
      shopId,
      ...(shopOwnerId && { shopOwnerId }),
      status: 'PENDING'
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Approve/reject approval request
 */
export async function updateApprovalStatus(
  id: string,
  shopId: string,
  status: 'APPROVED' | 'REJECTED',
  approvedBy: string,
  rejectionReason?: string
) {
  return await prisma.approvalRequest.updateMany({
    where: { 
      id,
      shopId // Security: Ensure request belongs to the shop
    },
    data: {
      status,
      approvedBy,
      approvedAt: new Date(),
      rejectionReason
    }
  })
}

/**
 * Get approval requests by shop (with filters)
 */
export async function getApprovalRequestsByShop(
  shopId: string,
  filters?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
    workerId?: string
    type?: string
  }
) {
  return await prisma.approvalRequest.findMany({
    where: {
      shopId,
      ...(filters as any)
    },
    orderBy: { createdAt: 'desc' }
  })
}

// ============================================
// SHOP CONTEXT HELPER
// ============================================

/**
 * Get current shop ID from session/context
 * This should be implemented based on your auth setup
 */
export function getCurrentShopId(/* session or context */): string {
  // TODO: Implement based on your auth/session management
  // Example:
  // return session.user.currentShopId
  // or
  // return context.shopId
  throw new Error('getCurrentShopId not implemented')
}

/**
 * Verify user has access to shop
 */
export async function verifyShopAccess(userId: string, shopId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedShops: true,
      workerShops: true
    }
  })

  if (!user) return false

  // Check if user owns the shop
  const ownsShop = user.ownedShops.some(shop => shop.id === shopId)
  if (ownsShop) return true

  // Check if user is a worker in the shop
  const isWorker = user.workerShops.some(worker => worker.shopId === shopId && worker.isActive)
  return isWorker
}

