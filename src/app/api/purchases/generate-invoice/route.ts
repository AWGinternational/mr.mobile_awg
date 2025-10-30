import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

// GET /api/purchases/generate-invoice - Generate unique invoice number
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get shop ID
    let shopId: string | undefined

    if (session.user.role === UserRole.SHOP_OWNER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: { where: { status: 'ACTIVE' }, take: 1 } }
      })
      shopId = user?.ownedShops[0]?.id
    } else if (session.user.role === UserRole.SHOP_WORKER) {
      const worker = await prisma.shopWorker.findFirst({
        where: {
          userId: session.user.id,
          isActive: true
        }
      })
      shopId = worker?.shopId
    }

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'No active shop found' },
        { status: 404 }
      )
    }

    // Get current date for invoice prefix
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')

    // Count today's purchases to generate sequential number
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    const todayPurchasesCount = await prisma.purchase.count({
      where: {
        shopId,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    })

    // Generate invoice number: PO-YYYYMMDD-XXX
    // Example: PO-20241016-001
    const sequenceNumber = (todayPurchasesCount + 1).toString().padStart(3, '0')
    const invoiceNumber = `PO-${year}${month}${day}-${sequenceNumber}`

    // Check if invoice number already exists (edge case)
    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        invoiceNumber,
        shopId
      }
    })

    if (existingPurchase) {
      // If exists, add timestamp suffix
      const timestamp = Date.now().toString().slice(-4)
      return NextResponse.json({
        success: true,
        invoiceNumber: `${invoiceNumber}-${timestamp}`
      })
    }

    return NextResponse.json({
      success: true,
      invoiceNumber
    })

  } catch (error) {
    console.error('Generate invoice error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate invoice number' },
      { status: 500 }
    )
  }
}
