import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ServiceType, LoadProvider, TransactionStatus } from '@/generated/prisma';

// Helper function to calculate commission based on service type
function calculateCommission(serviceType: ServiceType, amount: number): { rate: number; commission: number } {
  const rateMap: Record<ServiceType, number> = {
    EASYPAISA_CASHIN: 10,
    EASYPAISA_CASHOUT: 20, // Receiving - 20 PKR per 1,000
    JAZZCASH_CASHIN: 10,
    JAZZCASH_CASHOUT: 20, // Receiving - 20 PKR per 1,000
    BANK_TRANSFER: 20,
    MOBILE_LOAD: 26,
    BILL_PAYMENT: 10,
  };

  const rate = rateMap[serviceType];
  const commission = (amount / 1000) * rate;

  return { rate, commission };
}

// GET - List mobile service transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's shop
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        ownedShops: true,
        workerShops: { include: { shop: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine shop ID
    let shopId: string | null = null;
    if (user.role === 'SHOP_OWNER' && user.ownedShops.length > 0) {
      shopId = user.ownedShops[0].id;
    } else if (user.role === 'SHOP_WORKER' && user.workerShops.length > 0) {
      shopId = user.workerShops[0].shop.id;
    }

    if (!shopId) {
      return NextResponse.json({ error: 'No shop found for user' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const serviceType = searchParams.get('serviceType') as ServiceType | null;
    const status = searchParams.get('status') as TransactionStatus | null;
    const searchQuery = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = { shopId };

    if (serviceType) {
      where.serviceType = serviceType;
    }

    if (status) {
      where.status = status;
    }

    if (searchQuery) {
      where.OR = [
        { customerName: { contains: searchQuery, mode: 'insensitive' } },
        { phoneNumber: { contains: searchQuery, mode: 'insensitive' } },
        { referenceId: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.transactionDate.lte = end;
      }
    }

    // Get total count
    const total = await prisma.mobileService.count({ where });

    // Get transactions
    const transactions = await prisma.mobileService.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching mobile services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mobile service transactions' },
      { status: 500 }
    );
  }
}

// POST - Create new mobile service transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's shop
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        ownedShops: true,
        workerShops: { include: { shop: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine shop ID
    let shopId: string | null = null;
    if (user.role === 'SHOP_OWNER' && user.ownedShops.length > 0) {
      shopId = user.ownedShops[0].id;
    } else if (user.role === 'SHOP_WORKER' && user.workerShops.length > 0) {
      shopId = user.workerShops[0].shop.id;
    }

    if (!shopId) {
      return NextResponse.json({ error: 'No shop found for user' }, { status: 404 });
    }

    const body = await request.json();
    const {
      serviceType,
      loadProvider,
      customerName,
      phoneNumber,
      amount,
      discount = 0,
      referenceId,
      notes,
      transactionDate,
      commissionRate, // Accept commission rate from frontend
      commission, // Accept commission from frontend
    } = body;

    // Validate required fields
    if (!serviceType || !amount) {
      return NextResponse.json(
        { error: 'Service type and amount are required' },
        { status: 400 }
      );
    }

    // Validate load provider for MOBILE_LOAD service
    if (serviceType === 'MOBILE_LOAD' && !loadProvider) {
      return NextResponse.json(
        { error: 'Load provider is required for mobile load service' },
        { status: 400 }
      );
    }

    // Use frontend-calculated commission if provided, otherwise fallback to backend calculation
    let finalRate = commissionRate;
    let finalCommission = commission;
    
    if (finalRate === undefined || finalCommission === undefined) {
      // Fallback to hardcoded rates (for backward compatibility)
      const calculated = calculateCommission(serviceType, parseFloat(amount));
      finalRate = calculated.rate;
      finalCommission = calculated.commission;
    }

    // Calculate net commission (after discount)
    const netCommission = finalCommission - parseFloat(discount || 0);

    // Create transaction
    const transaction = await prisma.mobileService.create({
      data: {
        shopId,
        serviceType,
        loadProvider: serviceType === 'MOBILE_LOAD' ? loadProvider : null,
        customerName: customerName || null,
        phoneNumber: phoneNumber || null,
        amount: parseFloat(amount),
        commissionRate: finalRate,
        commission: finalCommission,
        discount: parseFloat(discount || 0),
        netCommission,
        referenceId: referenceId || null,
        notes: notes || null,
        status: 'COMPLETED',
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      { transaction, message: 'Transaction created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating mobile service transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
