import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TransactionStatus } from '@/generated/prisma';

// Helper function to recalculate commission
function recalculateCommission(transaction: any, newAmount: number, newDiscount: number) {
  const rate = transaction.commissionRate;
  const commission = (newAmount / 1000) * rate;
  const netCommission = commission - newDiscount;
  
  return { commission, netCommission };
}

// PATCH - Update transaction
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

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

    // Get existing transaction
    const existingTransaction = await prisma.mobileService.findFirst({
      where: { id, shopId },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Recalculate commission if amount or discount changed
    const newAmount = body.amount || existingTransaction.amount;
    const newDiscount = body.discount || existingTransaction.discount;
    const { commission, netCommission } = recalculateCommission(
      existingTransaction,
      parseFloat(newAmount.toString()),
      parseFloat(newDiscount.toString())
    );

    // Update transaction
    const updatedTransaction = await prisma.mobileService.update({
      where: { id },
      data: {
        amount: parseFloat(newAmount.toString()),
        discount: parseFloat(newDiscount.toString()),
        commission,
        netCommission,
        customerName: body.customerName,
        phoneNumber: body.phoneNumber,
        referenceId: body.referenceId,
        status: body.status as TransactionStatus,
        notes: body.notes,
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

    return NextResponse.json({ transaction: updatedTransaction }, { status: 200 });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE - Delete transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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

    // Check if transaction exists and belongs to shop
    const existingTransaction = await prisma.mobileService.findFirst({
      where: { id, shopId },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Only shop owners can delete
    if (user.role !== 'SHOP_OWNER') {
      return NextResponse.json(
        { error: 'Only shop owners can delete transactions' },
        { status: 403 }
      );
    }

    // Delete transaction
    await prisma.mobileService.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Transaction deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
