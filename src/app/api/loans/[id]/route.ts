import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@/types'

// GET /api/loans/[id] - Get single loan with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        customer: true,
        installments: {
          orderBy: { installmentNo: 'asc' }
        }
      }
    })

    if (!loan) {
      return NextResponse.json(
        { success: false, error: 'Loan not found' },
        { status: 404 }
      )
    }

    // Verify shop access for non-admin
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      const customer = await prisma.customer.findUnique({
        where: { id: loan.customerId }
      })
      
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { 
          ownedShops: true,
          workerShops: { include: { shop: true } }
        }
      })
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === customer?.shopId) ||
                       user?.workerShops.some(ws => ws.shop.id === customer?.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: { loan }
    })
  } catch (error) {
    console.error('Get loan error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loan' },
      { status: 500 }
    )
  }
}

// PUT /api/loans/[id] - Update loan (mainly status)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN and SHOP_OWNER can update loans
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Check if loan exists
    const existingLoan = await prisma.loan.findUnique({
      where: { id },
      include: { customer: true }
    })

    if (!existingLoan) {
      return NextResponse.json(
        { success: false, error: 'Loan not found' },
        { status: 404 }
      )
    }

    // Verify shop access for non-admin
    if (session.user.role === UserRole.SHOP_OWNER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: true }
      })
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === existingLoan.customer.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Update loan
    const updateData: any = {}
    
    if (body.status) updateData.status = body.status
    if (body.nextDueDate) updateData.nextDueDate = new Date(body.nextDueDate)

    const loan = await prisma.loan.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        installments: {
          orderBy: { installmentNo: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { loan },
      message: 'Loan updated successfully'
    })
  } catch (error) {
    console.error('Update loan error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update loan' },
      { status: 500 }
    )
  }
}

// DELETE /api/loans/[id] - Delete loan (only if no payments made)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN and SHOP_OWNER can delete loans
    if (![UserRole.SUPER_ADMIN, UserRole.SHOP_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if loan exists
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: { customer: true }
    })

    if (!loan) {
      return NextResponse.json(
        { success: false, error: 'Loan not found' },
        { status: 404 }
      )
    }

    // Verify shop access for non-admin
    if (session.user.role === UserRole.SHOP_OWNER) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { ownedShops: true }
      })
      
      const hasAccess = user?.ownedShops.some(shop => shop.id === loan.customer.shopId)
      
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Check if any payments have been made
    if (parseFloat(loan.paidAmount.toString()) > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete loan with payments. Set status to SUSPENDED instead.' 
        },
        { status: 409 }
      )
    }

    // Delete loan (will cascade delete installments)
    await prisma.loan.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Loan deleted successfully'
    })
  } catch (error) {
    console.error('Delete loan error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete loan' },
      { status: 500 }
    )
  }
}

