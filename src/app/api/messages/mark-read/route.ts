// API Route: Mark Message as Read
// Path: /api/messages/mark-read
// Purpose: Mark a message as read

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Check if user is the receiver
    if (message.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only mark messages sent to you as read' },
        { status: 403 }
      );
    }

    // Mark as read
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Message marked as read',
      data: updatedMessage
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { 
        error: 'Failed to mark message as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
