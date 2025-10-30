// API Route: Get Messages
// Path: /api/messages
// Purpose: Retrieve messages for the current user (owner or worker)

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
    const messageType = searchParams.get('messageType'); // DIRECT, BROADCAST, ANNOUNCEMENT
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const conversationWith = searchParams.get('conversationWith'); // Get conversation with specific user
    const viewAll = searchParams.get('viewAll') === 'true'; // Super Admin: view all messages

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

    // Super Admin can view all messages without shopId
    if (!isSuperAdmin && !shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // ==========================================
    // SUPER ADMIN: View all system messages
    // ==========================================
    if (isSuperAdmin && viewAll) {
      const whereClause: any = {};
      
      // Optionally filter by shop
      if (shopId) {
        whereClause.shopId = shopId;
      }

      // Filter by message type if specified
      if (messageType) {
        whereClause.messageType = messageType;
      }

      const messages = await prisma.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          shop: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          messageReads: {
            select: {
              userId: true,
              readAt: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100 // Limit for performance
      });

      return NextResponse.json({
        success: true,
        data: messages,
        totalCount: messages.length
      });
    }

    // Build the query
    const whereClause: any = {
      shopId,
      OR: [
        { receiverId: session.user.id }, // Direct messages to me
        { senderId: session.user.id },   // Messages I sent
        { 
          messageType: 'BROADCAST',       // Broadcast messages in my shop
        },
        {
          messageType: 'ANNOUNCEMENT'      // Announcements in my shop
        }
      ]
    };

    // Filter by message type if specified
    if (messageType) {
      whereClause.messageType = messageType;
    }

    // Filter by unread only
    if (unreadOnly) {
      whereClause.isRead = false;
      whereClause.receiverId = session.user.id; // Only show unread messages sent to me
    }

    // Filter by conversation (messages between me and a specific user)
    if (conversationWith) {
      whereClause.OR = [
        { senderId: session.user.id, receiverId: conversationWith },
        { senderId: conversationWith, receiverId: session.user.id }
      ];
      whereClause.messageType = 'DIRECT';
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        messageReads: {
          select: {
            userId: true,
            readAt: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get unread count
    const unreadCount = await prisma.message.count({
      where: {
        ...(shopId && { shopId }),
        receiverId: session.user.id,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      data: messages,
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
