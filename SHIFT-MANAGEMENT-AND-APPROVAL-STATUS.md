# Shift Management & Approval System - Status Report

## ✅ Completed: Shift Management System

### What's Implemented:

#### 1. **Shift Tracking Hook** (`/src/hooks/use-shift-status.ts`)
- ✅ `shiftActive` - Boolean flag for shift status
- ✅ `shiftStartTime` - ISO timestamp of shift start
- ✅ `duration` - Real-time minutes counter
- ✅ `startShift()` - Begin shift with toast notification
- ✅ `endShift()` - End shift with duration summary
- ✅ `requireShift()` - Validation function for feature access
- ✅ localStorage persistence across page refreshes
- ✅ Real-time duration updates every second

#### 2. **Shift Guard Component** (`/src/components/auth/shift-guard.tsx`)
- ✅ **Global enforcement** - Blocks access to all worker pages
- ✅ **Dashboard exemption** - Workers can access dashboard to start shift
- ✅ **Full-screen blocking** - Beautiful UI explaining why features are locked
- ✅ **Feature list display** - Shows what's locked (POS, Mobile Services, etc.)
- ✅ **Automatic redirect** - "Go to Dashboard & Start Shift" button
- ✅ **Storage event listener** - Syncs shift status across tabs

#### 3. **Worker Dashboard Integration** (`/src/app/dashboard/worker/page.tsx`)
- ✅ **Prominent shift banner** at top of page
- ✅ **Two states**:
  - 🔴 Not Started: Large red warning banner with "Start My Shift" button
  - 🟢 Active: Green success banner showing start time & duration
- ✅ **Visual feedback**:
  - Animated pulse effect on active shift
  - Red/Orange gradient when locked
  - Green/Emerald gradient when active
- ✅ **Locked content warning** - Yellow banner explaining blocked features
- ✅ **Disabled UI elements** - All cards/buttons grayed out when shift inactive
- ✅ **Removed commission tracking** - Clean worker-focused dashboard

#### 4. **Protected Pages** (Shift Guard Applied)
- ✅ **POS System** (`/src/app/dashboard/pos/page.tsx`)
  - Workers MUST start shift to access
  - Owners can access without shift
- ✅ **Mobile Services** (`/src/app/mobile-services/page.tsx`)
  - EasyPaisa, JazzCash, Bank Transfer services
  - Blocked for workers without shift
  - Owners unrestricted

### How It Works:

```
Worker Login → Dashboard → See Red Warning Banner
                    ↓
            Click "Start My Shift"
                    ↓
        Shift Active + Timestamp Saved
                    ↓
    Green Banner Shows (Duration Counting)
                    ↓
      All Features Now Unlocked ✅
                    ↓
    Worker can access: POS, Mobile Services, etc.
                    ↓
            Click "End Shift"
                    ↓
        Shows Total Hours Worked
                    ↓
            All Features Locked 🔒
```

### Shift Enforcement Locations:

| Page/Feature | Requires Shift? | Status |
|--------------|----------------|---------|
| Worker Dashboard | ❌ No (can start shift here) | ✅ Implemented |
| POS System | ✅ Yes (ShiftGuard applied) | ✅ Implemented |
| Mobile Services | ✅ Yes (ShiftGuard applied) | ✅ Implemented |
| Products Page | ⚠️ Should be Yes | ❌ Not yet applied |
| Categories Page | ⚠️ Should be Yes | ❌ Not yet applied |
| Brands Page | ⚠️ Should be Yes | ❌ Not yet applied |
| Inventory Page | ⚠️ Should be Yes | ❌ Not yet applied |
| Customers Page | ⚠️ Should be Yes | ❌ Not yet applied |

---

## ⚠️ INCOMPLETE: Approval System

### What Exists (But Not Integrated):

#### 1. **Approval API Routes** ✅
- `/api/approvals/route.ts` - List all approval requests
- `/api/approvals/request/route.ts` - Create new approval request
- `/api/approvals/[requestId]/approve/route.ts` - Approve request
- `/api/approvals/[requestId]/reject/route.ts` - Reject request

#### 2. **Approval UI Component** ✅
- `/src/components/approvals/ApprovalRequestDialog.tsx` - Dialog for workers to submit requests
- `/src/app/approvals/page.tsx` - Owner's approval dashboard

#### 3. **Database Schema** ✅ (from Prisma)
```prisma
model ApprovalRequest {
  id          String   @id @default(cuid())
  shopId      String
  workerId    String
  requestType String   // 'CREATE' | 'UPDATE' | 'DELETE'
  tableName   String   // 'Product' | 'Category' | 'Brand'
  recordData  Json
  reason      String?
  status      String   @default("PENDING") // 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### ❌ What's Missing (Critical Implementation Gaps):

#### 1. **No Integration in Products Page**
- Workers can currently CREATE/UPDATE/DELETE products **directly**
- Should be:
  - ✅ CREATE → Direct (worker can do it)
  - ⚠️ UPDATE → **Should trigger approval request dialog**
  - ⚠️ DELETE → **Should trigger approval request dialog**

**Current Code Issue:**
```typescript
// products/page.tsx - Workers can edit/delete directly
// NO APPROVAL CHECK EXISTS!
const handleEdit = (product) => {
  // Directly opens edit form - WRONG for workers!
  setEditingProduct(product)
  setShowForm(true)
}

const handleDelete = async (id) => {
  // Directly deletes - WRONG for workers!
  await fetch(`/api/products/${id}`, { method: 'DELETE' })
}
```

**What Should Happen:**
```typescript
const handleEdit = (product) => {
  if (user.role === 'SHOP_WORKER') {
    // Show approval request dialog
    setApprovalRequest({
      type: 'UPDATE',
      tableName: 'Product',
      data: product
    })
    setShowApprovalDialog(true)
  } else {
    // Owner can edit directly
    setEditingProduct(product)
    setShowForm(true)
  }
}
```

#### 2. **No Integration in Categories Page**
- Same issue as products
- Workers can UPDATE/DELETE categories directly (should require approval)

#### 3. **No Integration in Brands Page**
- Same issue as products
- Workers can UPDATE/DELETE brands directly (should require approval)

#### 4. **No Owner Notification System**
- Owners don't get notified when workers submit approval requests
- Should have:
  - Badge on sidebar showing pending count
  - Toast notification when new request arrives
  - Email notification (optional)

#### 5. **No Worker Feedback System**
- Workers submit approval requests but have no visibility
- Should have:
  - "Request Submitted" confirmation
  - List of their pending/approved/rejected requests
  - Notification when owner approves/rejects

---

## 🎯 Required Implementation Plan

### Phase 1: Apply Shift Guard to All Worker Pages (30 min)

**Files to Update:**
```bash
# Add ShiftGuard wrapper to:
src/app/products/page.tsx
src/app/categories/page.tsx  
src/app/brands/page.tsx
src/app/inventory/page.tsx
src/app/customers/page.tsx
```

**Code Pattern:**
```typescript
// At top of file
import { ShiftGuard } from '@/components/auth/shift-guard'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/types'

// At bottom of file
export default function PageWithShiftGuard() {
  const { user } = useAuth()
  
  if (user?.role === UserRole.SHOP_WORKER) {
    return (
      <ShiftGuard>
        <OriginalPageComponent />
      </ShiftGuard>
    )
  }
  
  return <OriginalPageComponent />
}
```

---

### Phase 2: Integrate Approval System into Products (1-2 hours)

**Step 1: Update Products Page**
```typescript
// Add approval dialog import
import { ApprovalRequestDialog } from '@/components/approvals/ApprovalRequestDialog'

// Add state
const [showApprovalDialog, setShowApprovalDialog] = useState(false)
const [approvalRequest, setApprovalRequest] = useState<any>(null)

// Modify edit handler
const handleEdit = (product: Product) => {
  if (user?.role === UserRole.SHOP_WORKER) {
    // Worker needs approval for updates
    setApprovalRequest({
      type: 'UPDATE',
      tableName: 'Product',
      data: product
    })
    setShowApprovalDialog(true)
  } else {
    // Owner can edit directly
    setEditingProduct(product)
    setShowForm(true)
  }
}

// Modify delete handler
const handleDelete = async (product: Product) => {
  if (user?.role === UserRole.SHOP_WORKER) {
    // Worker needs approval for deletes
    setApprovalRequest({
      type: 'DELETE',
      tableName: 'Product',
      data: product
    })
    setShowApprovalDialog(true)
  } else {
    // Owner can delete directly (with confirmation)
    if (confirm(`Delete ${product.name}?`)) {
      await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
      refreshProducts()
    }
  }
}

// Add approval submission handler
const handleApprovalSubmit = async (reason: string) => {
  const response = await fetch('/api/approvals/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestType: approvalRequest.type,
      tableName: approvalRequest.tableName,
      recordData: approvalRequest.data,
      reason
    })
  })
  
  if (response.ok) {
    toast({
      title: '✅ Approval request submitted',
      description: 'Your shop owner will review this request'
    })
  }
}

// Add dialog at end of JSX
<ApprovalRequestDialog
  open={showApprovalDialog}
  onOpenChange={setShowApprovalDialog}
  requestType={approvalRequest?.type}
  tableName={approvalRequest?.tableName}
  recordData={approvalRequest?.data}
  onSubmit={handleApprovalSubmit}
/>
```

---

### Phase 3: Add Approval Notifications to Owner Dashboard (1 hour)

**Step 1: Update Owner Dashboard API** (`/api/dashboard/owner/route.ts`)
```typescript
// Add pending approvals count
const pendingApprovals = await prisma.approvalRequest.count({
  where: {
    shopId: shop.id,
    status: 'PENDING'
  }
})

return {
  // ... existing data
  pendingApprovals, // Add this
}
```

**Step 2: Update Owner Dashboard UI**
```typescript
// Add card for pending approvals
<Card 
  className="bg-gradient-to-br from-yellow-500 to-yellow-600"
  onClick={() => router.push('/approvals')}
>
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-yellow-100 text-sm">Pending Approvals</p>
        <p className="text-4xl font-bold text-white">
          {dashboardData.pendingApprovals}
        </p>
      </div>
      <AlertCircle className="h-9 w-9 text-white" />
    </div>
  </CardContent>
</Card>
```

---

### Phase 4: Add "My Requests" Page for Workers (1 hour)

**Create:** `/src/app/my-requests/page.tsx`
```typescript
// Worker can see their own approval requests
// Shows: Pending, Approved, Rejected
// Can cancel pending requests
// See owner's feedback on rejected requests
```

---

## 📊 Business Logic Summary

### **Permission Matrix:**

| Action | Owner | Worker (Direct) | Worker (Approval) |
|--------|-------|-----------------|-------------------|
| CREATE Product | ✅ Yes | ✅ Yes | ❌ N/A |
| UPDATE Product | ✅ Yes | ❌ No | ⚠️ Needs Approval |
| DELETE Product | ✅ Yes | ❌ No | ⚠️ Needs Approval |
| CREATE Category | ✅ Yes | ✅ Yes | ❌ N/A |
| UPDATE Category | ✅ Yes | ❌ No | ⚠️ Needs Approval |
| DELETE Category | ✅ Yes | ❌ No | ⚠️ Needs Approval |
| CREATE Brand | ✅ Yes | ✅ Yes | ❌ N/A |
| UPDATE Brand | ✅ Yes | ❌ No | ⚠️ Needs Approval |
| DELETE Brand | ✅ Yes | ❌ No | ⚠️ Needs Approval |
| POS Sales | ✅ Yes | ✅ Yes (with shift) | ❌ N/A |
| Mobile Services | ✅ Yes | ✅ Yes (with shift) | ❌ N/A |

### **Workflow:**

```
Worker wants to UPDATE/DELETE product
                ↓
    Check: Is shift active? → No → Block with ShiftGuard ❌
                ↓ Yes
    Show "Request Approval" dialog
                ↓
    Worker enters reason for change
                ↓
    Submit to /api/approvals/request
                ↓
        Status: PENDING (stored in DB)
                ↓
    Owner sees notification on dashboard
                ↓
    Owner reviews in /approvals page
                ↓
        APPROVED → Change applied automatically
                ↓
        REJECTED → Worker notified with reason
```

---

## 🚀 Quick Start: Enable Approvals

### Minimal Implementation (Products Page Only):

1. **Import approval components:**
```bash
# In /src/app/products/page.tsx - add imports
```

2. **Wrap edit/delete with role check:**
```typescript
if (user?.role === 'SHOP_WORKER') {
  // Show approval dialog
} else {
  // Execute directly
}
```

3. **Add approval dialog to UI:**
```tsx
<ApprovalRequestDialog ... />
```

4. **Test:**
- Login as worker
- Try to edit product → Should show approval dialog
- Submit request → Should save to database
- Login as owner → Go to /approvals → See pending request
- Approve/Reject → Worker sees result

---

## 📝 Summary

### ✅ **WORKING:**
1. Shift management fully functional
2. POS & Mobile Services protected with shift guard
3. Worker dashboard with shift controls
4. Approval API endpoints exist
5. Approval UI components exist

### ⚠️ **NEEDS INTEGRATION:**
1. **Shift Guard** → Apply to Products, Categories, Brands, Inventory, Customers pages
2. **Approval System** → Integrate into Products/Categories/Brands edit/delete actions
3. **Owner Notifications** → Show pending approval count on dashboard
4. **Worker Requests Page** → Let workers track their own requests

### 🎯 **Priority Order:**
1. **HIGH**: Apply ShiftGuard to all remaining pages (prevents bypass)
2. **HIGH**: Integrate approval dialog into Products page (most used feature)
3. **MEDIUM**: Add approval notifications to owner dashboard
4. **LOW**: Create "My Requests" page for workers

---

**Current Status:** 60% Complete
**Estimated Time to 100%:** 3-4 hours of focused development
