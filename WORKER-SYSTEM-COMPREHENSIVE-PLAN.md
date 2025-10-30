# 🔧 Worker Dashboard & Permissions System - Comprehensive Analysis & Plan

## 📊 Current Status Assessment

### ✅ **What's Working:**

1. **Worker Dashboard Exists** ✅
   - Location: `/src/app/dashboard/worker/page.tsx`
   - Basic UI with mock data
   - Shows performance metrics, recent transactions
   - Restricted actions display
   - Pending approvals section

2. **Database Schema Ready** ✅
   - `ShopWorker` model exists
   - `ShopWorkerModuleAccess` table ready
   - Permission system defined
   - Module access controls in place

3. **Permission Enums Defined** ✅
   ```prisma
   enum Permission {
     VIEW, CREATE, EDIT, DELETE, MANAGE
   }
   
   enum SystemModule {
     PRODUCT_MANAGEMENT, INVENTORY_MANAGEMENT, 
     POS_SYSTEM, CUSTOMER_MANAGEMENT, SALES_REPORTS,
     SUPPLIER_MANAGEMENT, PAYMENT_PROCESSING,
     DAILY_CLOSING, LOAN_MANAGEMENT, REPAIR_MANAGEMENT,
     SERVICE_MANAGEMENT, BUSINESS_ANALYTICS
   }
   ```

4. **Worker Authentication** ✅
   - Workers can log in
   - Session includes worker info
   - Role-based route protection works

5. **API Shop Isolation** ✅
   - APIs check for worker's shopId
   - Data filtered by worker's assigned shop
   - No cross-shop data leakage

---

## ❌ **What's Missing / Not Working:**

### 1. **Worker Dashboard Uses Mock Data** ❌
```typescript
// Current: Hardcoded mock data
const workerData = {
  workerName: 'Ahmad Ali',  // ❌ Not from database
  todaySales: 45000,         // ❌ Not real sales
  todayTransactions: 18,     // ❌ Not real transactions
  // ... all mock data
}
```

**Problem**: Dashboard shows fake data, not connected to real database.

### 2. **No Permission Enforcement** ❌
- Workers can access ALL modules (same as owner)
- No granular permission checks
- No CREATE/EDIT/DELETE restrictions
- Module access not controlled

**Current Behavior**:
- Worker clicks "Products" → Full CRUD access ❌
- Worker clicks "Suppliers" → Can delete suppliers ❌
- Worker clicks "Settings" → Can change shop settings ❌

### 3. **No Approval System** ❌
- No approval request creation
- No approval workflow database tables
- No owner approval interface
- Pending approvals are mock data

### 4. **No Worker-Specific APIs** ❌
- No `/api/dashboard/worker` endpoint
- No worker performance tracking
- No worker-specific reports
- No commission calculations

### 5. **No Permission Management UI** ❌
- Owner can't configure worker permissions
- No UI to grant/revoke module access
- No permission history/audit log

### 6. **No Approval Requests Tracking** ❌
```prisma
// This table doesn't exist yet!
model ApprovalRequest {
  id          String
  workerId    String
  requestType String
  status      String
  // ...
}
```

---

## 🎯 Owner vs Worker: Feature Comparison

| Feature | Owner | Worker (Current) | Worker (Should Be) |
|---------|-------|------------------|-------------------|
| **Dashboard** | Real data ✅ | Mock data ❌ | Real data ✅ |
| **POS Access** | Full ✅ | Full ✅ | Full ✅ |
| **Add Products** | Yes ✅ | Yes ❌ | Request approval 🟡 |
| **Edit Products** | Yes ✅ | Yes ❌ | Request approval 🟡 |
| **Delete Products** | Yes ✅ | Yes ❌ | No access ❌ |
| **View Inventory** | Yes ✅ | Yes ✅ | Yes ✅ |
| **Adjust Stock** | Yes ✅ | Yes ❌ | Request approval 🟡 |
| **Add Customers** | Yes ✅ | Yes ✅ | Yes ✅ |
| **Delete Customers** | Yes ✅ | Yes ❌ | Request approval 🟡 |
| **Daily Closing** | Create/View ✅ | View only ✅ | View only ✅ |
| **Add Suppliers** | Yes ✅ | Yes ❌ | Request approval 🟡 |
| **Delete Suppliers** | Yes ✅ | No ❌ | No ❌ |
| **View Sales** | All sales ✅ | All sales ❌ | Own sales only 🟡 |
| **Sales Reports** | Full ✅ | Full ❌ | Basic only 🟡 |
| **Payments** | Full ✅ | Full ❌ | View only ✅ |
| **Loans** | Manage ✅ | Manage ❌ | View only ✅ |
| **Shop Settings** | Full ✅ | No access ❌ | No access ❌ |
| **Worker Management** | Add/Remove ✅ | No access ❌ | No access ❌ |
| **Financial Reports** | Full ✅ | No access ❌ | Own performance 🟡 |

**Legend**:
- ✅ Full access
- 🟡 Limited/Restricted access
- ❌ No access

---

## 🏗️ Comprehensive Implementation Plan

### **Phase 1: Core Worker Infrastructure** (Priority: HIGH)

#### 1.1 Create Worker Dashboard API ✨
**File**: `/src/app/api/dashboard/worker/route.ts`

**Features**:
- Fetch worker's real sales data
- Calculate today's transactions
- Get pending approval requests
- Calculate commission
- Worker shift information
- Recent transactions by worker

**Implementation**:
```typescript
// Endpoint structure
GET /api/dashboard/worker
- Returns: {
    worker: { id, name, email, shopName }
    todayMetrics: { sales, transactions, commission }
    recentTransactions: [...] // Last 10 sales by this worker
    pendingApprovals: [...] // Worker's pending requests
    performance: { weekly, monthly }
    shiftInfo: { start, end, hoursWorked }
  }
```

#### 1.2 Add `sellerId` to Sale Model 🔧
**File**: `prisma/schema.prisma`

```prisma
model Sale {
  // ... existing fields
  sellerId    String?  // Worker who made the sale
  seller      User?    @relation("SaleSeller", fields: [sellerId], references: [id])
}
```

**Why**: Track which worker made each sale for performance metrics.

#### 1.3 Create Approval Request System 📋
**File**: `prisma/schema.prisma`

```prisma
model ApprovalRequest {
  id            String            @id @default(cuid())
  workerId      String
  shopId        String
  requestType   ApprovalType      // PRODUCT_ADD, PRODUCT_EDIT, etc.
  module        SystemModule
  status        ApprovalStatus    @default(PENDING)
  priority      Priority          @default(NORMAL)
  
  // Request details
  itemId        String?           // Product/Customer/Supplier ID
  itemName      String?           // Display name
  oldValues     Json?             // Before edit
  newValues     Json              // After edit / New data
  reason        String?           // Worker's reason
  
  // Workflow
  requestedAt   DateTime          @default(now())
  reviewedAt    DateTime?
  reviewedBy    String?
  reviewNote    String?
  
  // Relations
  worker        User              @relation("WorkerRequests", fields: [workerId], references: [id])
  shop          Shop              @relation("ApprovalRequests", fields: [shopId], references: [id])
  reviewer      User?             @relation("ReviewedRequests", fields: [reviewedBy], references: [id])
  
  @@map("approval_requests")
}

enum ApprovalType {
  PRODUCT_CREATE
  PRODUCT_EDIT
  PRODUCT_DELETE
  PRICE_UPDATE
  STOCK_ADJUSTMENT
  CUSTOMER_EDIT
  CUSTOMER_DELETE
  SUPPLIER_CREATE
  SUPPLIER_EDIT
  REFUND_REQUEST
  DISCOUNT_OVERRIDE
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

#### 1.4 Create Permission Middleware 🔐
**File**: `/src/lib/worker-permissions.ts`

```typescript
export async function checkWorkerPermission(
  userId: string,
  shopId: string,
  module: SystemModule,
  permission: Permission
): Promise<boolean> {
  // Check ShopWorkerModuleAccess table
  // Return true/false based on permissions
}

export function enforcePermission(
  module: SystemModule,
  permission: Permission
) {
  // Middleware for API routes
  // Throws error if permission denied
}
```

---

### **Phase 2: Permission Management UI** (Priority: HIGH)

#### 2.1 Owner Permission Management Page
**File**: `/src/app/settings/workers/page.tsx`

**Features**:
- List all workers in shop
- Configure permissions per worker
- Module-level toggles (enable/disable)
- Permission-level checkboxes (VIEW, CREATE, EDIT, DELETE)
- Quick templates: "Basic", "Advanced", "POS Only"
- Permission history log

**UI Sections**:
```
1. Workers List
   - Name, Email, Status
   - "Manage Permissions" button

2. Permission Matrix (per worker)
   ┌──────────────────┬──────┬────────┬──────┬────────┐
   │ Module           │ VIEW │ CREATE │ EDIT │ DELETE │
   ├──────────────────┼──────┼────────┼──────┼────────┤
   │ Products         │  ✓   │   ✓    │  ✓   │   ✗    │
   │ Inventory        │  ✓   │   ✓    │  ✗   │   ✗    │
   │ POS System       │  ✓   │   ✓    │  ✓   │   ✗    │
   │ Customers        │  ✓   │   ✓    │  ✓   │   ✗    │
   │ Sales Reports    │  ✓   │   ✗    │  ✗   │   ✗    │
   │ Suppliers        │  ✓   │   ✗    │  ✗   │   ✗    │
   │ Daily Closing    │  ✓   │   ✗    │  ✗   │   ✗    │
   └──────────────────┴──────┴────────┴──────┴────────┘

3. Quick Permission Templates
   [ Basic Worker ] [ POS Only ] [ Advanced ] [ Custom ]
```

#### 2.2 Create WorkerPermissionsDialog Component
**File**: `/src/components/shop/WorkerPermissionsDialog.tsx`

Already exists! Check if it's functional and update.

---

### **Phase 3: Approval Request Workflow** (Priority: MEDIUM)

#### 3.1 Worker Request Creation
**Files**: Update existing module pages

**Product Page** (`/products/page.tsx`):
```typescript
// When worker tries to add product:
if (isWorker && !hasPermission('PRODUCT_MANAGEMENT', 'CREATE')) {
  // Show "Request Approval" dialog
  const request = await createApprovalRequest({
    type: 'PRODUCT_CREATE',
    newValues: productData,
    reason: 'Need to add new product'
  })
  // Show success: "Request sent to owner"
}
```

#### 3.2 Owner Approval Dashboard
**File**: `/src/app/approvals/page.tsx` (NEW)

**Features**:
- List all pending approval requests
- Filter by type, priority, worker
- Quick approve/reject buttons
- View request details
- Add review notes
- Batch operations

**UI**:
```
┌─────────────────────────────────────────────────────────┐
│ Pending Approval Requests (5)                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🟡 HIGH PRIORITY - Ahmad Ali                           │
│    Product Edit: iPhone 15 Pro - Price Change          │
│    Old: PKR 430,000 → New: PKR 420,000                │
│    Reason: Market rate decreased                        │
│    Requested: 2 hours ago                               │
│    [ ✓ Approve ]  [ ✗ Reject ]  [ 👁️ Details ]        │
│                                                         │
│ 🟢 NORMAL - Fatima Sheikh                              │
│    Stock Adjustment: Samsung S24 - Add 5 units         │
│    Reason: New stock received from supplier             │
│    Requested: 4 hours ago                               │
│    [ ✓ Approve ]  [ ✗ Reject ]  [ 👁️ Details ]        │
└─────────────────────────────────────────────────────────┘
```

#### 3.3 Real-Time Notifications
**Implementation**: Add to both worker and owner dashboards

- Workers: Badge showing pending request status
- Owners: Badge showing pending approvals count
- Browser notifications (optional)

---

### **Phase 4: Worker-Specific Features** (Priority: MEDIUM)

#### 4.1 Sales Tracking by Worker
**Update POS**: `/src/app/dashboard/pos/page.tsx`

```typescript
// When creating sale, include seller ID
const saleData = {
  // ... existing fields
  sellerId: session.user.id, // Current logged-in user
}
```

#### 4.2 Worker Performance Reports
**File**: `/src/app/reports/worker-performance/page.tsx` (NEW)

**Features**:
- Sales by worker (chart)
- Commission calculations
- Hourly/daily/weekly breakdown
- Top performers leaderboard
- Individual worker drill-down

#### 4.3 Commission System
**File**: `/src/app/api/commissions/route.ts` (NEW)

**Commission Rules** (configurable per shop):
```typescript
interface CommissionRule {
  percentage: number  // e.g., 3%
  minSale: number    // Minimum sale to earn commission
  maxDaily: number   // Daily commission cap
  bonusThreshold: number // Bonus if exceeds target
}
```

#### 4.4 Shift Management
**File**: `/src/app/api/shifts/route.ts` (NEW)

**Features**:
- Clock in/out tracking
- Break time tracking
- Overtime calculation
- Shift reports

---

### **Phase 5: Advanced Features** (Priority: LOW)

#### 5.1 Worker Activity Log
Track all worker actions:
- Login/logout times
- Sales made
- Approval requests submitted
- Modules accessed
- Errors encountered

#### 5.2 Worker Training Mode
- Simulated POS for practice
- Tutorial overlays
- Achievement badges
- Progress tracking

#### 5.3 Worker Chat/Communication
- Internal messaging between workers and owner
- Shift handover notes
- Issue reporting

#### 5.4 Mobile App for Workers
- Native mobile app
- Barcode scanning
- Quick POS access
- Push notifications

---

## 📋 Implementation Checklist

### **Immediate (Week 1)**:
- [ ] Create Worker Dashboard API endpoint
- [ ] Connect worker dashboard to real data
- [ ] Add `sellerId` field to Sale model
- [ ] Create ApprovalRequest model in schema
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Seed sample approval requests

### **Short-term (Week 2)**:
- [ ] Create permission middleware
- [ ] Add permission checks to all module APIs
- [ ] Create Owner permission management UI
- [ ] Test permission enforcement
- [ ] Create approval request API endpoints
- [ ] Build approval request creation dialogs

### **Medium-term (Week 3-4)**:
- [ ] Create Owner approval dashboard
- [ ] Implement approval workflow (approve/reject)
- [ ] Add real-time notifications
- [ ] Build worker performance reports
- [ ] Implement commission calculations
- [ ] Add shift management

### **Long-term (Month 2)**:
- [ ] Worker activity logging
- [ ] Advanced analytics
- [ ] Training mode
- [ ] Mobile app planning

---

## 🔐 Permission Matrix (Single Worker Role)

### ⚠️ **Important: There is ONLY ONE WORKER ROLE**

All workers have the same **default permissions**, which can be customized per individual by the shop owner. There are NO "Basic", "Advanced", or "Senior" worker types.

### **Default Worker Permissions** (Standard for ALL Workers):
```typescript
{
  // Core Sales Function - FULL ACCESS
  POS_SYSTEM: [VIEW, CREATE],
  SERVICE_MANAGEMENT: [VIEW, CREATE],  // Mobile services
  
  // Product & Inventory - READ ONLY
  PRODUCT_MANAGEMENT: [VIEW],
  INVENTORY_MANAGEMENT: [VIEW],
  SUPPLIER_MANAGEMENT: [VIEW],
  
  // Customers - CREATE & EDIT
  CUSTOMER_MANAGEMENT: [VIEW, CREATE, EDIT],
  
  // Reports - VIEW OWN ONLY
  SALES_REPORTS: [VIEW],  // Filtered to own sales
  
  // No Access to:
  PAYMENT_PROCESSING: [],        // Owner only
  DAILY_CLOSING: [],             // Owner only
  BUSINESS_ANALYTICS: [],        // Owner only
  LOAN_MANAGEMENT: [],           // Owner only
  REPAIR_MANAGEMENT: []          // Owner only
}
```

### **Owner Can Customize Per Worker**:
Owners can grant additional permissions to individual workers:
- ✅ Allow product creation (with approval)
- ✅ Allow inventory adjustments (with approval)
- ✅ Allow customer deletion (with approval)
- ✅ Allow viewing all sales (not just own)
- ❌ **Never** allow: Shop settings, worker management, financial reports

### **Approval System**:
Workers can REQUEST permissions for restricted actions:
- Add/Edit products → Owner approves
- Adjust stock → Owner approves
- Large discounts → Owner approves
- Refunds → Owner approves
- Delete customers → Owner approves

---

## 🎯 Success Criteria

### **Must Have** (MVP):
1. ✅ Worker can log in and see real dashboard data
2. ✅ Worker can make sales in POS
3. ✅ Permission system prevents unauthorized actions
4. ✅ Worker can request approvals for restricted actions
5. ✅ Owner can approve/reject worker requests
6. ✅ Owner can configure worker permissions

### **Should Have** (v1.0):
1. ✅ Real-time performance metrics
2. ✅ Commission calculations
3. ✅ Worker-specific sales reports
4. ✅ Shift management
5. ✅ Activity logging

### **Nice to Have** (v2.0):
1. ✅ Mobile app
2. ✅ Training mode
3. ✅ Gamification (achievements)
4. ✅ Advanced analytics

---

## 🚀 Quick Start Guide (For Testing)

### **Test Worker Login**:
```
Email: ahmed@mrmobile.com
Password: password123
Shop: Ali Mobile Center (Lahore)
```

### **What You'll See**:
1. **Current**: Mock dashboard with fake data
2. **After Phase 1**: Real sales data, actual transactions
3. **After Phase 2**: Permission restrictions in effect
4. **After Phase 3**: Approval requests working

---

## 📊 Database Migrations Needed

### **Migration 1: Add sellerId to Sale**
```prisma
model Sale {
  // Add this field:
  sellerId    String?
  seller      User?    @relation("SaleSeller", fields: [sellerId], references: [id])
}
```

### **Migration 2: Create ApprovalRequest**
```prisma
// Full model from Phase 1.3
model ApprovalRequest { ... }
```

### **Migration 3: Add Commission Settings**
```prisma
model Shop {
  // Add to settings JSON:
  commissionRate Float @default(3.0)
  commissionCap  Float @default(10000)
}
```

---

## 💡 Key Insights

### **Why Approval System?**
- Prevents mistakes by inexperienced workers
- Maintains data integrity
- Creates audit trail
- Builds trust with owners

### **Why Granular Permissions?**
- Flexibility for different worker skill levels
- Security (least privilege principle)
- Customizable per shop's needs
- Easy to audit and manage

### **Why Track Sales by Worker?**
- Performance metrics
- Fair commission calculation
- Identify training needs
- Motivation through competition

---

## 🎓 Next Steps

1. **Review this document** with team
2. **Prioritize features** based on business needs
3. **Start with Phase 1** (Core Infrastructure)
4. **Test with real workers** after each phase
5. **Iterate based on feedback**

---

**Status**: 📝 Ready for Implementation
**Priority**: 🔥 HIGH (Core feature for multi-user shops)
**Estimated Time**: 4-6 weeks for full implementation
**Impact**: ⭐⭐⭐⭐⭐ (Critical for production use)

