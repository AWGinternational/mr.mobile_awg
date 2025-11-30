import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'
import { z } from 'zod'

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  cnic: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  creditLimit: z.number().optional()
})

/**
 * GET /api/customers?shopId=xxx
 * Get all customers for a shop
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const shopId = searchParams.get('shopId')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 })
    }

    // Build where clause
    const where: {
      shopId: string
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        phone?: { contains: string }
        email?: { contains: string; mode: 'insensitive' }
      }>
    } = {
      shopId
    }

    // Add search filter if provided
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch customers and total count in parallel
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          sales: {
            select: {
              id: true,
              totalAmount: true,
              createdAt: true
            }
          },
          loans: {
            select: {
              id: true,
              totalAmount: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.customer.count({ where })
    ])

    // Transform data to include calculated fields
    const customersWithStats = customers.map(customer => {
      const totalPurchases = customer.sales.length
      const totalSpent = customer.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
      const lastPurchase = customer.sales.length > 0 
        ? customer.sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : null
      const activeLoans = customer.loans.filter(l => l.status === 'ACTIVE').length

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        cnic: customer.cnic,
        address: customer.address,
        city: customer.city,
        creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
        creditUsed: Number(customer.creditUsed),
        totalPurchases,
        totalSpent,
        lastPurchase,
        activeLoans,
        createdAt: customer.createdAt
      }
    })

    return NextResponse.json({
      customers: customersWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/customers
 * Create a new customer
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { shopId, ...customerData } = body

    if (!shopId) {
      return NextResponse.json({ error: 'shopId is required' }, { status: 400 })
    }

    // Validate customer data
    const validatedData = customerSchema.parse(customerData)

    // Check if customer with same phone already exists in this shop
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: validatedData.phone,
        shopId
      }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this phone number already exists' },
        { status: 400 }
      )
    }

    // Check if CNIC already exists in this shop (if provided)
    if (validatedData.cnic) {
      const existingCnic = await prisma.customer.findFirst({
        where: {
          cnic: validatedData.cnic,
          shopId
        }
      })

      if (existingCnic) {
        return NextResponse.json(
          { error: 'Customer with this CNIC already exists' },
          { status: 400 }
        )
      }
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        shopId,
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email || null,
        cnic: validatedData.cnic || null,
        address: validatedData.address || null,
        city: validatedData.city || null,
        creditLimit: validatedData.creditLimit || null
      }
    })

    return NextResponse.json({ 
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        cnic: customer.cnic,
        address: customer.address,
        city: customer.city,
        creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
        creditUsed: Number(customer.creditUsed),
        totalPurchases: 0,
        totalSpent: 0,
        lastPurchase: null,
        activeLoans: 0,
        createdAt: customer.createdAt
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating customer:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}

