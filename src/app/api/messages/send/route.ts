// API Route: Send Message
// Path: /api/messages/send
// Purpose: Send messages between owners and workers

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
    const {
      receiverId,
      messageType = 'DIRECT',
      subject,
      content,
      priority = 'NORMAL',
      shopId,
      broadcastTo, // 'ALL_OWNERS', 'ALL_WORKERS', 'SHOP_WORKERS'
    } = body;

    // Validate required fields
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    const isOwner = session.user.role === 'SHOP_OWNER';
    const isWorker = session.user.role === 'SHOP_WORKER';

    // Super Admin system-wide announcements don't need shopId
    if (!isSuperAdmin && !shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // For DIRECT messages, receiverId is required
    if (messageType === 'DIRECT' && !receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required for direct messages' },
        { status: 400 }
      );
    }

    // ==========================================
    // SUPER ADMIN: System-wide Announcements
    // ==========================================
    if (isSuperAdmin && broadcastTo) {
      let targetUsers: any[] = [];
      let messagesSent = 0;

      if (broadcastTo === 'ALL_OWNERS') {
        // Get all shop owners
        targetUsers = await prisma.user.findMany({
          where: { role: 'SHOP_OWNER', status: 'ACTIVE' },
          include: { ownedShops: true }
        });

        // Create message for each owner's shop
        for (const owner of targetUsers) {
          for (const shop of owner.ownedShops) {
            await prisma.message.create({
              data: {
                shopId: shop.id,
                senderId: session.user.id,
                receiverId: owner.id,
                messageType: 'ANNOUNCEMENT',
                subject,
                content: content.trim(),
                priority
              }
            });
            messagesSent++;
          }
        }
      } else if (broadcastTo === 'ALL_WORKERS') {
        // Get all active workers
        const workers = await prisma.shopWorker.findMany({
          where: { isActive: true },
          include: { user: true }
        });

        for (const worker of workers) {
          await prisma.message.create({
            data: {
              shopId: worker.shopId,
              senderId: session.user.id,
              receiverId: worker.userId,
              messageType: 'ANNOUNCEMENT',
              subject,
              content: content.trim(),
              priority
            }
          });
          messagesSent++;
        }
      } else if (broadcastTo === 'ALL_USERS') {
        // Send to both owners and workers
        const allUsers = await prisma.user.findMany({
          where: {
            role: { in: ['SHOP_OWNER', 'SHOP_WORKER'] },
            status: 'ACTIVE'
          },
          include: { ownedShops: true, workerShops: true }
        });

        for (const user of allUsers) {
          if (user.role === 'SHOP_OWNER') {
            for (const shop of user.ownedShops) {
              await prisma.message.create({
                data: {
                  shopId: shop.id,
                  senderId: session.user.id,
                  receiverId: user.id,
                  messageType: 'ANNOUNCEMENT',
                  subject,
                  content: content.trim(),
                  priority
                }
              });
              messagesSent++;
            }
          } else if (user.role === 'SHOP_WORKER') {
            for (const workerShop of user.workerShops) {
              await prisma.message.create({
                data: {
                  shopId: workerShop.shopId,
                  senderId: session.user.id,
                  receiverId: user.id,
                  messageType: 'ANNOUNCEMENT',
                  subject,
                  content: content.trim(),
                  priority
                }
              });
              messagesSent++;
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `System-wide announcement sent to ${messagesSent} recipients`,
        data: { messagesSent, broadcastTo }
      });
    }

    // ==========================================
    // SHOP OWNER: Shop-specific Messages
    // ==========================================
    if (isOwner) {
      // Verify owner owns the shop
      const shop = await prisma.shop.findFirst({
        where: {
          id: shopId,
          ownerId: session.user.id
        }
      });

      if (!shop) {
        return NextResponse.json(
          { error: 'Shop not found or access denied' },
          { status: 403 }
        );
      }

      // Broadcast to all workers in the shop
      if (broadcastTo === 'SHOP_WORKERS') {
        const workers = await prisma.shopWorker.findMany({
          where: { shopId, isActive: true },
          include: { user: true }
        });

        const messages = await Promise.all(
          workers.map(worker =>
            prisma.message.create({
              data: {
                shopId,
                senderId: session.user.id,
                receiverId: worker.userId,
                messageType: 'BROADCAST',
                subject,
                content: content.trim(),
                priority
              }
            })
          )
        );

        return NextResponse.json({
          success: true,
          message: `Broadcast sent to ${messages.length} workers`,
          data: { messagesSent: messages.length }
        });
      }
    } else if (isWorker) {
      // Verify worker is assigned to the shop
      const shopWorker = await prisma.shopWorker.findFirst({
        where: {
          userId: session.user.id,
          shopId: shopId,
          isActive: true
        }
      });

      if (!shopWorker) {
        return NextResponse.json(
          { error: 'Worker not assigned to this shop' },
          { status: 403 }
        );
      }
    } else if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only super admins, shop owners and workers can send messages' },
        { status: 403 }
      );
    }

    // ==========================================
    // DIRECT MESSAGE: One-to-one communication
    // ==========================================
    const message = await prisma.message.create({
      data: {
        shopId,
        senderId: session.user.id,
        receiverId: messageType === 'DIRECT' ? receiverId : null,
        messageType,
        subject,
        content: content.trim(),
        priority
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        receiver: receiverId ? {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        } : undefined
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
