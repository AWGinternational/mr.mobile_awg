# 💬 Owner-Worker Messaging System - Complete Implementation

## 📋 Overview

The messaging system enables real-time communication between shop owners and workers, allowing remote management and instruction. This is essential for owners who are not physically present at the shop.

## ✅ Implementation Status: **COMPLETE**

### What Was Built

1. **Database Schema**
   - ✅ Message model with support for direct and broadcast messages
   - ✅ MessageRead model for tracking read receipts on broadcast messages
   - ✅ MessageType enum (DIRECT, BROADCAST, ANNOUNCEMENT)
   - ✅ Priority levels (LOW, NORMAL, HIGH, URGENT)
   - ✅ Complete indexing for performance

2. **API Routes**
   - ✅ `/api/messages/send` - Send messages (direct or broadcast)
   - ✅ `/api/messages` - Retrieve messages with filters
   - ✅ `/api/messages/mark-read` - Mark messages as read
   - ✅ `/api/messages/users` - Get available users for messaging

3. **User Interface**
   - ✅ Messages page with inbox and compose functionality
   - ✅ Contact sidebar showing available users
   - ✅ Real-time message updates (30-second polling)
   - ✅ Unread message badges and notifications
   - ✅ Conversation threading
   - ✅ Priority indicators with color coding
   - ✅ Mobile-responsive design

4. **Features**
   - ✅ Direct messaging between owner and workers
   - ✅ Broadcast messages from owner to all workers
   - ✅ Message priority levels
   - ✅ Read receipts and status tracking
   - ✅ Unread message count
   - ✅ Message filtering and conversation view
   - ✅ Auto-refresh every 30 seconds

## 🗄️ Database Schema

### Message Model
```prisma
model Message {
  id          String      @id @default(cuid())
  shopId      String
  senderId    String
  receiverId  String?     // null for broadcast messages
  messageType MessageType @default(DIRECT)
  subject     String?     // Optional subject line
  content     String      @db.Text
  priority    Priority    @default(NORMAL)
  isRead      Boolean     @default(false)
  readAt      DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relations
  shop         Shop          @relation("ShopMessages")
  sender       User          @relation("SentMessages")
  receiver     User?         @relation("ReceivedMessages")
  messageReads MessageRead[] // For broadcast messages

  @@index([shopId])
  @@index([senderId])
  @@index([receiverId])
  @@index([createdAt])
  @@index([isRead])
}

model MessageRead {
  id        String   @id @default(cuid())
  messageId String
  userId    String
  readAt    DateTime @default(now())

  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id])

  @@unique([messageId, userId])
  @@index([messageId])
  @@index([userId])
}
```

### Message Types
- **DIRECT**: One-to-one messages between owner and worker
- **BROADCAST**: Owner sends to all workers simultaneously
- **ANNOUNCEMENT**: Shop-wide announcements (future use)

### Priority Levels
- **LOW**: General information
- **NORMAL**: Standard messages (default)
- **HIGH**: Important updates
- **URGENT**: Critical issues requiring immediate attention

## 🔌 API Endpoints

### 1. Send Message
**POST** `/api/messages/send`

**Request Body:**
```json
{
  "receiverId": "user_id",        // Required for DIRECT, null for BROADCAST
  "messageType": "DIRECT",        // DIRECT or BROADCAST
  "subject": "Optional subject",  // Optional
  "content": "Message text",      // Required
  "priority": "NORMAL",           // LOW, NORMAL, HIGH, URGENT
  "shopId": "shop_id"            // Required
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "msg_id",
    "senderId": "sender_id",
    "receiverId": "receiver_id",
    "messageType": "DIRECT",
    "subject": "Subject",
    "content": "Message content",
    "priority": "NORMAL",
    "isRead": false,
    "createdAt": "2025-01-22T15:00:00Z",
    "sender": {
      "id": "user_id",
      "name": "Ali Khan",
      "email": "ali@example.com",
      "role": "SHOP_OWNER"
    },
    "receiver": {
      "id": "worker_id",
      "name": "Ahmed Worker",
      "email": "ahmed@example.com",
      "role": "SHOP_WORKER"
    }
  }
}
```

### 2. Get Messages
**GET** `/api/messages?shopId={shopId}&conversationWith={userId}&messageType={type}&unreadOnly=true`

**Query Parameters:**
- `shopId` (required): Shop ID
- `conversationWith` (optional): Get conversation with specific user
- `messageType` (optional): Filter by DIRECT, BROADCAST, or ANNOUNCEMENT
- `unreadOnly` (optional): Show only unread messages

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_id",
      "senderId": "sender_id",
      "receiverId": "receiver_id",
      "messageType": "DIRECT",
      "content": "Message text",
      "priority": "HIGH",
      "isRead": true,
      "readAt": "2025-01-22T15:30:00Z",
      "createdAt": "2025-01-22T15:00:00Z",
      "sender": { /* user object */ },
      "receiver": { /* user object */ }
    }
  ],
  "unreadCount": 5
}
```

### 3. Mark Message as Read
**POST** `/api/messages/mark-read`

**Request Body:**
```json
{
  "messageId": "msg_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message marked as read",
  "data": {
    "id": "msg_id",
    "isRead": true,
    "readAt": "2025-01-22T15:45:00Z"
  }
}
```

### 4. Get Available Users
**GET** `/api/messages/users?shopId={shopId}`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_id",
      "name": "Ahmed Worker",
      "email": "ahmed@example.com",
      "phone": "+923001234567",
      "role": "SHOP_WORKER",
      "lastLogin": "2025-01-22T14:00:00Z"
    }
  ]
}
```

## 🎨 User Interface Components

### Messages Page Features

1. **Compose Dialog**
   - Select message type (Direct/Broadcast)
   - Choose recipient (for direct messages)
   - Set priority level
   - Optional subject line
   - Rich text message content

2. **Contact Sidebar**
   - List of all available users
   - Owner sees all workers
   - Workers see owner and other workers
   - Quick conversation switching

3. **Message List**
   - Chronological message display
   - Visual distinction between sent and received
   - Unread indicator (bold text)
   - Priority badges with color coding
   - Read receipts (checkmark icon)
   - Time stamps for all messages

4. **Auto-Refresh**
   - Polls for new messages every 30 seconds
   - Updates unread count automatically
   - Maintains conversation context

## 🔐 Security & Permissions

### Access Control

**Shop Owners can:**
- ✅ Send direct messages to any worker
- ✅ Send broadcast messages to all workers
- ✅ View all messages in their shop
- ✅ See message read status

**Shop Workers can:**
- ✅ Send direct messages to shop owner
- ✅ Send direct messages to other workers
- ✅ View messages sent to them
- ✅ View broadcast messages from owner
- ❌ Cannot send broadcast messages

### Validation Rules

1. **Sender Verification**
   - User must be authenticated
   - User must belong to the shop (owner or worker)

2. **Recipient Verification**
   - For direct messages, recipient must exist and belong to shop
   - For broadcast messages, all active workers receive it

3. **Message Content**
   - Content cannot be empty
   - Maximum length enforced by database (TEXT type)
   - Subject is optional

## 📱 Usage Examples

### Example 1: Owner Sending Instructions to Worker
```typescript
// Owner composing urgent message
await fetch('/api/messages/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    receiverId: 'worker_ahmed_id',
    messageType: 'DIRECT',
    subject: 'Important: Price Change',
    content: 'Please update the price of Samsung Galaxy S24 to Rs. 285,000 immediately.',
    priority: 'URGENT',
    shopId: 'shop_001'
  })
});
```

### Example 2: Owner Broadcasting Announcement
```typescript
// Owner sending announcement to all workers
await fetch('/api/messages/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    receiverId: null, // Broadcast has no specific receiver
    messageType: 'BROADCAST',
    subject: 'Shop Closing Early Today',
    content: 'The shop will close at 8 PM today due to maintenance. Please inform all customers.',
    priority: 'HIGH',
    shopId: 'shop_001'
  })
});
```

### Example 3: Worker Requesting Assistance
```typescript
// Worker asking owner for help
await fetch('/api/messages/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    receiverId: 'owner_ali_id',
    messageType: 'DIRECT',
    subject: 'Customer Query',
    content: 'A customer is asking about trade-in value for iPhone 13. What should I offer?',
    priority: 'HIGH',
    shopId: 'shop_001'
  })
});
```

## 🎯 Testing Guide

### Test Scenarios

**1. Send Direct Message (Owner → Worker)**
- Login as owner (ali@mrmobile.com)
- Navigate to Messages page
- Click "New Message"
- Select "Direct Message"
- Choose a worker from dropdown
- Set priority to "HIGH"
- Enter subject and message
- Click "Send Message"
- Verify success notification

**2. Send Broadcast Message (Owner → All Workers)**
- Login as owner
- Click "New Message"
- Select "Broadcast to All Workers"
- Set priority to "URGENT"
- Enter announcement message
- Click "Send Message"
- Verify all workers receive it

**3. Worker Viewing Messages**
- Login as worker (ahmed@mrmobile.com)
- Navigate to Messages page
- Verify unread count shows in badge
- Click on a message to mark as read
- Verify checkmark appears
- Verify bold text removed (read status)

**4. Conversation Threading**
- Login as worker
- Click on owner's name in sidebar
- Verify only conversation with owner shows
- Send a reply
- Verify conversation stays filtered

**5. Auto-Refresh Test**
- Login as worker in one browser
- Login as owner in another browser
- Send message from owner
- Wait 30 seconds
- Verify worker sees new message without refreshing

## 🚀 Migration Applied

Migration file: `20251022150111_add_messaging_system/migration.sql`

**Changes:**
- Created `MessageType` enum
- Created `messages` table with all fields and indexes
- Created `message_reads` table for broadcast message tracking
- Added foreign keys and cascade delete rules

**Status:** ✅ Successfully applied to database

## 📊 Performance Optimizations

1. **Database Indexes**
   - shopId index for fast shop filtering
   - senderId and receiverId indexes for user queries
   - createdAt index for chronological sorting
   - isRead index for unread filtering
   - Composite unique index on message_reads (messageId, userId)

2. **Query Optimization**
   - Selective field loading with Prisma includes
   - Pagination support (can be added if needed)
   - Efficient filtering with indexed columns

3. **Frontend Optimization**
   - Auto-refresh interval (30s) balances freshness with performance
   - Local state management for instant UI updates
   - Optimistic UI updates when marking as read

## 🔄 Future Enhancements (Optional)

### Potential Features

1. **Real-Time Updates**
   - WebSocket integration for instant message delivery
   - Push notifications for mobile devices

2. **Rich Media Support**
   - Image attachments
   - File sharing (invoices, receipts)
   - Voice messages

3. **Advanced Features**
   - Message search functionality
   - Message archiving
   - Message templates for common instructions
   - Typing indicators
   - Message reactions (👍, ❤️, etc.)

4. **Analytics**
   - Message response time tracking
   - Communication frequency reports
   - Read rate analytics

## 📝 Files Created/Modified

### New Files Created
1. `/src/app/api/messages/send/route.ts` - Send message API
2. `/src/app/api/messages/route.ts` - Get messages API
3. `/src/app/api/messages/mark-read/route.ts` - Mark read API
4. `/src/app/api/messages/users/route.ts` - Get users API
5. `/src/app/messages/page.tsx` - Messages UI page

### Modified Files
1. `/prisma/schema.prisma` - Added Message and MessageRead models
2. `/src/components/layout/BusinessSidebar.tsx` - Added Messages menu item

### Migration Files
1. `/prisma/migrations/20251022150111_add_messaging_system/migration.sql`

## ✅ Checklist for Production

- [x] Database schema created
- [x] Migration applied successfully
- [x] API routes implemented with proper authentication
- [x] User interface built with responsive design
- [x] Permission checks implemented
- [x] Sidebar menu item added
- [x] Auto-refresh functionality working
- [x] Read receipt system functional
- [x] Broadcast messaging working
- [x] Documentation complete

## 🎉 Summary

The Owner-Worker Messaging System is **COMPLETE** and ready for use! 

**Key Benefits:**
- 💬 Seamless communication between remote owners and shop workers
- ⚡ Real-time updates with auto-refresh
- 🎯 Priority-based message handling
- 📊 Message read tracking and analytics
- 🔒 Secure with role-based access control
- 📱 Mobile-responsive for on-the-go communication

**System is production-ready and fully integrated into the Mr. Mobile shop management platform!**
