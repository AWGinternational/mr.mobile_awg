import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const customerUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().min(10, 'Valid phone number is required').optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  cnic: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  creditLimit: z.number().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get user's shop ID
    let shopId: string | undefined = session.user.shops?.[0]?.id
    
    if (!shopId && session.user.role === 'SHOP_WORKER') {
      const worker = await prisma.shopWorker.findFirst({
        where: { 
          userId: session.user.id,
          isActive: true 
        }
      })
      shopId = worker?.shopId
    }

    if (!shopId) {
      return NextResponse.json({ error: 'No shop assigned' }, { status: 400 })
    }

    // Get customer with shop isolation
    const customer = await prisma.customer.findFirst({
      where: {
        id: id,
        shopId: shopId
      },
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
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Transform customer data
    const totalPurchases = customer.sales.length
    const totalSpent = customer.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
    const lastPurchase = customer.sales.length > 0 
      ? customer.sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : null
    const activeLoans = customer.loans.filter(l => l.status === 'ACTIVE').length

    const transformedCustomer = {
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

    return NextResponse.json({
      success: true,
      customer: transformedCustomer
    })

  } catch (error) {
    console.error('Get customer API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Get user's shop ID
    let shopId: string | undefined = session.user.shops?.[0]?.id
    
    if (!shopId && session.user.role === 'SHOP_WORKER') {
      const worker = await prisma.shopWorker.findFirst({
        where: { 
          userId: session.user.id,
          isActive: true 
        }
      })
      shopId = worker?.shopId
    }

    if (!shopId) {
      return NextResponse.json({ error: 'No shop assigned' }, { status: 400 })
    }

    // Validate customer data
    const validatedData = customerUpdateSchema.parse(body)

    // Check if customer exists and belongs to user's shop
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: id,
        shopId: shopId
      }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Check if phone number is being changed and if it conflicts with existing customers
    if (validatedData.phone && validatedData.phone !== existingCustomer.phone) {
      const phoneConflict = await prisma.customer.findFirst({
        where: {
          phone: validatedData.phone,
          shopId: shopId,
          id: { not: id }
        }
      })

      if (phoneConflict) {
        return NextResponse.json(
          { error: 'Another customer with this phone number already exists' },
          { status: 400 }
        )
      }
    }

    // Check if CNIC is being changed and if it conflicts with existing customers
    if (validatedData.cnic && validatedData.cnic !== existingCustomer.cnic) {
      const cnicConflict = await prisma.customer.findFirst({
        where: {
          cnic: validatedData.cnic,
          shopId: shopId,
          id: { not: id }
        }
      })

      if (cnicConflict) {
        return NextResponse.json(
          { error: 'Another customer with this CNIC already exists' },
          { status: 400 }
        )
      }
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.phone && { phone: validatedData.phone }),
        ...(validatedData.email !== undefined && { email: validatedData.email || null }),
        ...(validatedData.cnic !== undefined && { cnic: validatedData.cnic || null }),
        ...(validatedData.address !== undefined && { address: validatedData.address || null }),
        ...(validatedData.city !== undefined && { city: validatedData.city || null }),
        ...(validatedData.creditLimit !== undefined && { creditLimit: validatedData.creditLimit || null })
      },
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
      }
    })

    // Transform updated customer data
    const totalPurchases = updatedCustomer.sales.length
    const totalSpent = updatedCustomer.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
    const lastPurchase = updatedCustomer.sales.length > 0 
      ? updatedCustomer.sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : null
    const activeLoans = updatedCustomer.loans.filter(l => l.status === 'ACTIVE').length

    const transformedCustomer = {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      phone: updatedCustomer.phone,
      email: updatedCustomer.email,
      cnic: updatedCustomer.cnic,
      address: updatedCustomer.address,
      city: updatedCustomer.city,
      creditLimit: updatedCustomer.creditLimit ? Number(updatedCustomer.creditLimit) : null,
      creditUsed: Number(updatedCustomer.creditUsed),
      totalPurchases,
      totalSpent,
      lastPurchase,
      activeLoans,
      createdAt: updatedCustomer.createdAt
    }

    return NextResponse.json({
      success: true,
      customer: transformedCustomer
    })

  } catch (error: any) {
    console.error('Update customer API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get user's shop ID
    let shopId: string | undefined = session.user.shops?.[0]?.id
    
    if (!shopId && session.user.role === 'SHOP_WORKER') {
      const worker = await prisma.shopWorker.findFirst({
        where: { 
          userId: session.user.id,
          isActive: true 
        }
      })
      shopId = worker?.shopId
    }

    if (!shopId) {
      return NextResponse.json({ error: 'No shop assigned' }, { status: 400 })
    }

    // Check if customer exists and belongs to user's shop
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: id,
        shopId: shopId
      },
      include: {
        sales: true,
        loans: true
      }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Check if customer has any sales or loans
    if (existingCustomer.sales.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer with existing sales. Consider archiving instead.' },
        { status: 400 }
      )
    }

    if (existingCustomer.loans.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer with existing loans. Please settle loans first.' },
        { status: 400 }
      )
    }

    // Delete customer
    await prisma.customer.delete({
      where: { id: id }
    })

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    })

  } catch (error) {
    console.error('Delete customer API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
