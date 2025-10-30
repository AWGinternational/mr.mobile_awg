// API Route: Get Available Users for Messaging
// Path: /api/messages/users
// Purpose: Get list of users (owner or workers) that current user can message

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    const isOwner = session.user.role === 'SHOP_OWNER';
    const isWorker = session.user.role === 'SHOP_WORKER';

    let users: any[] = [];

    if (isOwner) {
      // Owner can message all workers in their shop
      const shopWorkers = await prisma.shopWorker.findMany({
        where: {
          shopId,
          isActive: true
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              lastLogin: true
            }
          }
        }
      });

      users = shopWorkers.map(sw => sw.user);
    } else if (isWorker) {
      // Worker can message the shop owner
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              lastLogin: true
            }
          }
        }
      });

      if (shop?.owner) {
        users = [shop.owner];
      }

      // Optionally, workers can also message other workers
      const otherWorkers = await prisma.shopWorker.findMany({
        where: {
          shopId,
          isActive: true,
          userId: {
            not: session.user.id // Exclude current user
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              lastLogin: true
            }
          }
        }
      });

      users = [...users, ...otherWorkers.map(w => w.user)];
    }

    return NextResponse.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
