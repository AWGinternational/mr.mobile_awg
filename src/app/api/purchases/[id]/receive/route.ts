import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

// POST /api/purchases/[id]/receive - Receive stock and create inventory items
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN and SHOP_OWNER can receive stock
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const params = await context.params
    const purchaseId = params.id
    const body = await request.json()
    const { items } = body // items: [{ purchaseItemId, receivedQty, imeiNumbers, serialNumbers }]

    console.log('📦 Receive Stock Request:', {
      purchaseId,
      itemCount: items?.length,
      items: items?.map((item: any) => ({
        id: item.id || item.purchaseItemId,
        receivedQty: item.receivedQty,
        imeiCount: item.imeiNumbers?.length || 0,
        serialCount: item.serialNumbers?.length || 0
      }))
    })

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items to receive' },
        { status: 400 }
      )
    }

    // Get purchase with items
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        items: true,
        supplier: true
      }
    })

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Purchase not found' },
        { status: 404 }
      )
    }

    // Verify shop access
    let shopId: string | undefined

    if (session.user.role === UserRole.SHOP_OWNER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: { where: { status: 'ACTIVE' }, take: 1 } }
      })
      shopId = user?.ownedShops[0]?.id
    }

    if (shopId && purchase.shopId !== shopId) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this purchase' },
        { status: 403 }
      )
    }

    // Process each item
    const inventoryItemsCreated: any[] = []
    
    for (const item of items) {
      // Support both 'id' and 'purchaseItemId' for flexibility
      const itemId = item.id || item.purchaseItemId
      const purchaseItem = purchase.items.find(pi => pi.id === itemId)
      
      if (!purchaseItem) {
        console.log(`Purchase item not found for ID: ${itemId}`)
        continue
      }

      // The receivedQty from frontend is the NEW TOTAL, not additional quantity
      const newTotalReceived = parseInt(item.receivedQty)
      const previouslyReceived = purchaseItem.receivedQty
      const newlyReceivedQty = newTotalReceived - previouslyReceived

      // Skip if no new quantity is being received
      if (newlyReceivedQty <= 0) {
        console.log(`No new quantity for item ${itemId}: ${newTotalReceived} total, ${previouslyReceived} already received`)
        continue
      }

      const imeiNumbers = item.imeiNumbers || []
      const serialNumbers = item.serialNumbers || []

      console.log(`Receiving item ${itemId}: ${newlyReceivedQty} new units (${newTotalReceived} total, ${previouslyReceived} previously received)`)

      // Update purchase item with NEW TOTAL
      await prisma.purchaseItem.update({
        where: { id: itemId },
        data: {
          receivedQty: newTotalReceived,
          imeiNumbers: [...purchaseItem.imeiNumbers, ...imeiNumbers],
          serialNumbers: [...purchaseItem.serialNumbers, ...serialNumbers]
        }
      })

      // Create inventory items only for NEWLY received quantity
      for (let i = 0; i < newlyReceivedQty; i++) {
        const inventoryItem = await prisma.inventoryItem.create({
          data: {
            productId: purchaseItem.productId,
            imei: imeiNumbers[i] || null,
            serialNumber: serialNumbers[i] || null,
            batchNumber: purchase.invoiceNumber,
            status: 'IN_STOCK',
            costPrice: purchaseItem.unitCost,
            purchaseDate: new Date(),
            supplierId: purchase.supplierId,
            shopId: purchase.shopId
          }
        })

        inventoryItemsCreated.push(inventoryItem)
      }
    }

    // Check if all items are fully received
    const updatedPurchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: true }
    })

    const allReceived = updatedPurchase?.items.every(
      item => item.receivedQty >= item.quantity
    )

    const someReceived = updatedPurchase?.items.some(
      item => item.receivedQty > 0
    )

    // Update purchase status
    let newStatus = purchase.status
    if (allReceived) {
      newStatus = 'RECEIVED'
    } else if (someReceived) {
      newStatus = 'PARTIAL'
    }

    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: newStatus,
        receivedDate: allReceived ? new Date() : purchase.receivedDate
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        inventoryItems: inventoryItemsCreated,
        purchaseStatus: newStatus
      },
      message: `Successfully received ${inventoryItemsCreated.length} items`
    })
  } catch (error) {
    console.error('Receive stock error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to receive stock' },
      { status: 500 }
    )
  }
}
