import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

// GET /api/loans - Get all loans
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

    if (session.user.role === UserRole.SHOP_OWNER || session.user.role === UserRole.SHOP_WORKER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { 
          ownedShops: { where: { status: 'ACTIVE' }, take: 1 },
          workerShops: { where: { isActive: true }, take: 1, include: { shop: true } }
        }
      })
      
      if (session.user.role === UserRole.SHOP_OWNER) {
        shopId = user?.ownedShops[0]?.id
      } else if (session.user.role === UserRole.SHOP_WORKER) {
        shopId = user?.workerShops[0]?.shop?.id
      }
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'ALL'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { loanNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } }
      ]
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    // Add shop filter if needed
    if (shopId) {
      where.customer = {
        ...where.customer,
        shopId
      }
    }

    // Fetch loans with customer data
    const [loans, totalCount] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              cnic: true
            }
          },
          installments: {
            orderBy: { installmentNo: 'asc' }
          },
          _count: {
            select: {
              installments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.loan.count({ where })
    ])

    // Calculate statistics
    const stats = await prisma.loan.aggregate({
      where,
      _sum: {
        totalAmount: true,
        paidAmount: true,
        remainingAmount: true
      },
      _count: {
        id: true
      }
    })

    // Get status breakdown
    const statusBreakdown = await prisma.loan.groupBy({
      by: ['status'],
      where: shopId ? { customer: { shopId } } : {},
      _count: {
        id: true
      },
      _sum: {
        remainingAmount: true
      }
    })

    // Get overdue loans
    const today = new Date()
    const overdueCount = await prisma.loan.count({
      where: {
        ...where,
        status: 'ACTIVE',
        nextDueDate: {
          lt: today
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        loans,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        stats: {
          totalLoans: stats._count.id || 0,
          totalAmount: stats._sum.totalAmount || 0,
          totalPaid: stats._sum.paidAmount || 0,
          totalRemaining: stats._sum.remainingAmount || 0,
          overdueCount,
          statusBreakdown
        }
      }
    })
  } catch (error) {
    console.error('Get loans error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loans' },
      { status: 500 }
    )
  }
}

// POST /api/loans - Create new loan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN and SHOP_OWNER can create loans
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      customerId,
      loanNumber,
      principalAmount,
      interestRate = 0,
      totalInstallments,
      startDate
    } = body

    // Validation
    if (!customerId || !loanNumber || !principalAmount || !totalInstallments) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check for duplicate loan number
    const existingLoan = await prisma.loan.findUnique({
      where: { loanNumber }
    })

    if (existingLoan) {
      return NextResponse.json(
        { success: false, error: 'Loan with this number already exists' },
        { status: 409 }
      )
    }

    // Get customer to verify shop access
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Verify shop access
    if (session.user.role === UserRole.SHOP_OWNER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: true }
      })
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === customer.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Calculate loan amounts
    const principal = parseFloat(principalAmount)
    const rate = parseFloat(interestRate)
    const installments_count = parseInt(totalInstallments)
    const totalAmount = principal + (principal * rate / 100)
    const installmentAmount = totalAmount / installments_count

    // Calculate installment dates
    const loanStartDate = startDate ? new Date(startDate) : new Date()
    const installments = []
    
    for (let i = 1; i <= installments_count; i++) {
      const dueDate = new Date(loanStartDate)
      dueDate.setMonth(dueDate.getMonth() + i)
      
      installments.push({
        installmentNo: i,
        amount: installmentAmount,
        dueDate,
        status: 'PENDING'
      })
    }

    // Calculate end date
    const endDate = new Date(loanStartDate)
    endDate.setMonth(endDate.getMonth() + installments_count)

    // Create loan with installments
    const loan = await prisma.loan.create({
      data: {
        customerId,
        loanNumber,
        principalAmount: principal,
        interestRate: rate,
        totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        installmentAmount,
        totalInstallments: installments_count,
        paidInstallments: 0,
        status: 'ACTIVE',
        startDate: loanStartDate,
        endDate,
        nextDueDate: installments[0].dueDate,
        installments: {
          create: installments
        }
      },
      include: {
        customer: true,
        installments: true
      }
    })

    return NextResponse.json({
      success: true,
      data: { loan },
      message: 'Loan created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Create loan error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create loan' },
      { status: 500 }
    )
  }
}

