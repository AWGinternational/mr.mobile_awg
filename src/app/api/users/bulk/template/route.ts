import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateCSV, SHOP_OWNER_CSV_TEMPLATE, WORKER_CSV_TEMPLATE } from '@/lib/csv-utils'

// GET /api/users/bulk/template - Get CSV template for bulk import
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only Super Admin and Shop Owners can download templates
    if (!session?.user || !['SUPER_ADMIN', 'SHOP_OWNER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'shop-owner' or 'worker'

    let template: any
    let filename: string

    if (type === 'shop-owner') {
      template = SHOP_OWNER_CSV_TEMPLATE
      filename = 'shop-owners-template.csv'
    } else if (type === 'worker') {
      template = WORKER_CSV_TEMPLATE
      filename = 'workers-template.csv'
    } else {
      return NextResponse.json({ 
        error: 'Invalid template type. Use "shop-owner" or "worker"' 
      }, { status: 400 })
    }

    // Generate CSV with sample data
    const csv = generateCSV(template.sample, template.headers)

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Template download error:', error)
    return NextResponse.json({
      error: 'Failed to generate template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

