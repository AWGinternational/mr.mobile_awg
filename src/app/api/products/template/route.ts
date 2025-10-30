import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!['SHOP_OWNER', 'SHOP_WORKER', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Return template file path
    return NextResponse.json({
      success: true,
      templateUrl: '/product-import-template.csv',
      instructions: {
        required: ['name', 'model', 'sku', 'costPrice', 'sellingPrice', 'category', 'brand'],
        optional: ['barcode', 'description', 'minimumPrice', 'lowStockThreshold', 'reorderPoint', 'warranty', 'stock'],
        types: {
          name: 'string',
          model: 'string', 
          sku: 'string (unique)',
          barcode: 'string (unique, optional)',
          description: 'string (optional)',
          costPrice: 'number (required)',
          sellingPrice: 'number (required)',
          minimumPrice: 'number (optional)',
          lowStockThreshold: 'number (default: 5)',
          reorderPoint: 'number (default: 10)',
          warranty: 'number in months (default: 12)',
          type: 'MOBILE_PHONE | ACCESSORY | SIM_CARD | SERVICE (default: MOBILE_PHONE)',
          status: 'ACTIVE | INACTIVE (default: ACTIVE)',
          category: 'string (required) - will be created if not exists',
          brand: 'string (required) - will be created if not exists',
          stock: 'number (optional) - initial stock quantity (default: 1)'
        },
        examples: [
          'iPhone 15 Pro,Pro Max,APP-IP15PM-256,1234567890123,Latest iPhone,390000,420000,400000,2,5,12,MOBILE_PHONE,ACTIVE,Smartphones,Apple,5',
          'Samsung Galaxy S24,Ultra,SAM-GS24U-256,,Flagship phone,290000,310000,300000,1,3,12,MOBILE_PHONE,ACTIVE,Smartphones,Samsung,3'
        ]
      }
    })

  } catch (error) {
    console.error('Error getting template:', error)
    return NextResponse.json(
      { error: 'Failed to get template' },
      { status: 500 }
    )
  }
}
