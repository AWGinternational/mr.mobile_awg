// Temporary Products API for testing without authentication
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing products API without auth...')
    
    // Get all products for testing (first shop)
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        brand: {
          select: {
            id: true,
            name: true,
            code: true,
            logo: true,
          }
        },
        shop: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            inventoryItems: true
          }
        }
      },
      take: 20
    })

    console.log(`Found ${products.length} products`)
    
    // Add mock stock information
    const enhancedProducts = products.map(product => ({
      ...product,
      currentStock: 10, // Mock stock
      availableStock: 8,
      reservedStock: 2,
      isLowStock: false,
      needsReorder: false,
    }))

    return NextResponse.json({
      success: true,
      products: enhancedProducts,
      pagination: {
        total: products.length,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      debug: 'Test API without authentication',
    })

  } catch (error) {
    console.error('❌ Products API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        debug: 'Test API failed'
      },
      { status: 500 }
    )
  }
}
