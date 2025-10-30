// API Route: Worker Shift Settings
// Path: /api/workers/[workerId]/shifts
// Purpose: Manage worker shift schedules

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface ShiftTime {
  day: string;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workerId } = await params;

    // Check if user is shop owner or the worker themselves
    const isOwner = session.user.role === 'SHOP_OWNER';
    const isWorker = session.user.id === workerId;

    if (!isOwner && !isWorker) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get worker's shift settings
    const worker = await prisma.shopWorker.findFirst({
      where: {
        userId: workerId,
        isActive: true,
      },
      select: {
        id: true,
        permissions: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Get shift settings from permissions object (stored as JSON)
    const permissions = worker.permissions as any;
    const shifts = permissions?.shifts || null;

    return NextResponse.json({
      success: true,
      shifts,
      worker: worker.user,
    });

  } catch (error) {
    console.error('Failed to fetch shift settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shift settings' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SHOP_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workerId } = await params;
    const body = await request.json();
    const { shifts } = body as { shifts: ShiftTime[] };

    // Validate shifts
    if (!Array.isArray(shifts) || shifts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid shift data' },
        { status: 400 }
      );
    }

    // Get worker
    const worker = await prisma.shopWorker.findFirst({
      where: {
        userId: workerId,
        isActive: true,
        shop: {
          ownerId: session.user.id, // Ensure owner owns this shop
        }
      },
      select: {
        id: true,
        permissions: true,
      }
    });

    if (!worker) {
      return NextResponse.json(
        { error: 'Worker not found or access denied' },
        { status: 404 }
      );
    }

    // Update permissions with shift data
    const currentPermissions = (worker.permissions || {}) as any;
    const updatedPermissions = {
      ...currentPermissions,
      shifts,
    };

    // Save to database
    await prisma.shopWorker.update({
      where: {
        id: worker.id,
      },
      data: {
        permissions: updatedPermissions,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Shift settings updated successfully',
      shifts,
    });

  } catch (error) {
    console.error('Failed to update shift settings:', error);
    return NextResponse.json(
      { error: 'Failed to update shift settings' },
      { status: 500 }
    );
  }
}
