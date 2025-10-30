import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

/**
 * GET /api/pos/recent-products
 * Retrieves recently sold products for the current shop
 * Query params:
 * - limit: Number of products to return (default: 5)
 */
export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's shop ID (for shop workers, get their assigned shop)
    let shopId: string | undefined = session.user.shops?.[0]?.id
    
    if (!shopId && session.user.role === 'SHOP_WORKER') {
      const worker = await prisma.shopWorker.findFirst({
        where: { 
          userId: session.user.id,
          isActive: true 
        },
        include: { shop: true }
      })
      shopId = worker?.shopId
    }

    if (!shopId) {
      return NextResponse.json(
        { error: "No shop assigned" },
        { status: 400 }
      )
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "5")

    // Query recent products from sales
    // Get unique products from recent sales, ordered by most recent
    const recentSales = await prisma.sale.findMany({
      where: {
        shopId: shopId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50, // Get more sales to ensure we have enough unique products
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                brand: true
              }
            }
          }
        }
      }
    })

    // Extract unique products
    const productMap = new Map()
    
    for (const sale of recentSales) {
      for (const item of sale.items) {
        if (item.product && !productMap.has(item.product.id)) {
          productMap.set(item.product.id, {
            id: item.product.id,
            name: item.product.name,
            model: item.product.model,
            sellingPrice: item.product.sellingPrice,
            barcode: item.product.barcode,
            category: item.product.category?.name || 'Uncategorized',
            brand: item.product.brand?.name || 'Unknown',
            lastSold: sale.createdAt
          })
          
          // Stop once we have enough products
          if (productMap.size >= limit) {
            break
          }
        }
      }
      
      // Stop outer loop if we have enough
      if (productMap.size >= limit) {
        break
      }
    }

    // Convert map to array
    const products = Array.from(productMap.values())

    return NextResponse.json({
      success: true,
      products: products,
      count: products.length
    })

  } catch (error) {
    console.error("Error fetching recent products:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch recent products",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
