# 🔐 Owner vs Worker: Complete Module Access Matrix

## 📌 Important: Single Worker Role

There is **ONLY ONE WORKER ROLE** in the system - not "Basic", "Advanced", or "Senior". All workers have the same base permissions, which can be customized per individual by the shop owner.

---

## 🏗️ Module-by-Module Access Analysis

### 1. **Dashboard** 📊

| Feature | Owner | Worker | Notes |
|---------|-------|--------|-------|
| View Own Dashboard | ✅ Full | ✅ Full | Different dashboards |
| See Shop-Wide Metrics | ✅ Yes | ❌ No | Owner sees all sales, worker sees only their sales |
| View All Workers' Performance | ✅ Yes | ❌ No | Workers can't see other workers' stats |
| Export Reports | ✅ Yes | ❌ No | Only owner can export |

**Access**: Both have access, but see different data

---

### 2. **POS (Point of Sale)** 🛒

| Feature | Owner | Worker | Notes |
|---------|-------|--------|-------|
| Make Sales | ✅ Yes | ✅ Yes | Core function - both can sell |
| View Recent Transactions | ✅ All | 🟡 Own Only | Worker sees only their own sales |
| Process Refunds | ✅ Yes | ❌ Request Approval | Refunds need owner approval |
| Apply Discounts > 10% | ✅ Yes | ❌ Request Approval | Large discounts need approval |
| Override Prices | ✅ Yes | ❌ Request Approval | Price changes need approval |
| Delete Sale Items | ✅ Yes | ❌ Request Approval | Deletion needs approval |

**Access**: Both have full POS access, but workers have restrictions on modifications

**Implementation Needed**:
- ✅ sellerId tracking (DONE)
- ⏳ Discount approval threshold
- ⏳ Refund approval workflow

---

### 3. **Sales Module** 💰

| Feature | Owner | Worker | Notes |
|---------|-------|--------|-------|
| View All Sales | ✅ Yes | ❌ No | Worker can't see others' sales |
| View Own Sales | ✅ Yes | ✅ Yes | Workers see their own sales |
| Edit Sale | ✅ Yes | ❌ Request Approval | Modifications need approval |
| Delete Sale | ✅ Yes | ❌ No Access | Only owner can delete |
| Export Sales Data | ✅ Yes | ❌ No | Only owner exports |
| View Customer Purchase History | ✅ Yes | ✅ Yes | Both can view |

**Access**: Workers have VIEW access to own sales only

**Implementation Needed**:
- ⏳ Filter sales by sellerId for workers
- ⏳ Hide "Delete" button for workers
- ⏳ Add "Request Edit" for workers

---

### 4. **Products Module** 📱

| Feature | Owner | Worker | Notes |
|---------|-------|--------|-------|
| View Products | ✅ Yes | ✅ Yes | Both can view all products |
| Add New Product | ✅ Yes | ❌ Request Approval | Workers request to add |
| Edit Product Details | ✅ Yes | ❌ Request Approval | Changes need approval |
| Edit Prices | ✅ Yes | ❌ Request Approval | Price changes need approval |
| Delete Product | ✅ Yes | ❌ No Access | Only owner can delete |
| Import Products (CSV) | ✅ Yes | ❌ No Access | Only owner can bulk import |
| Export Products | ✅ Yes | ❌ No Access | Only owner exports |

**Access**: Workers have READ-ONLY access, CREATE/EDIT with approval

**Implementation Needed**:
- ⏳ Hide "Delete" and "Import" buttons for workers
- ⏳ Replace "Edit" with "Request Edit" for workers
- ⏳ Add "Request New Product" button for workers

---

### 5. **Inventory Module** 📦

| Feature | Owner | Worker | Notes |
|---------|-------|--------|-------|
| View Stock Levels | ✅ Yes | ✅ Yes | Both can check stock |
| Add Stock | ✅ Yes | ❌ Request Approval | Stock additions need approval |
| Adjust Stock | ✅ Yes | ❌ Request Approval | Adjustments need approval |
| Mark as Damaged | ✅ Yes | ❌ Request Approval | Damage reporting needs approval |
| Transfer Stock | ✅ Yes | ❌ No Access | Only owner transfers between shops |
| View Stock History | ✅ Yes | ✅ Yes | Both can view history |
| Low Stock Alerts | ✅ Yes | ✅ Yes | Both receive alerts |

**Access**: Workers have READ-ONLY access, modifications with approval

**Implementation Needed**:
- ⏳ Hide "Adjust Stock" direct buttons for workers
- ⏳ Add "Request Stock Adjustment" for workers
- ⏳ Stock transfer restricted to owner only

---

### 6. **Customers Module** 👥

| Feature | Owner | Worker | Notes |
|---------|-------|--------|-------|
| View All Customers | ✅ Yes | ✅ Yes | Both can view all customers |
| Add New Customer | ✅ Yes | ✅ Yes | Both can add customers freely |
| Edit Customer Info | ✅ Yes | ✅ Yes | Both can edit basic info |
| Delete Customer | ✅ Yes | ❌ Request Approval | Deletion needs approval |
| View Purchase History | ✅ Yes | ✅ Yes | Both can view |
| Manage Credit Limits | ✅ Yes | ❌ No Access | Only owner sets limits |
| Export Customer Data | ✅ Yes | ❌ No Access | Only owner exports |

**Access**: Workers have CREATE/EDIT access, DELETE with approval

**Implementation Needed**:
- ⏳ Hide "Delete" button for workers or show "Request Delete"
- ⏳ Lock "Credit Limit" field for workers
- ⏳ Hide "Export" button for workers

---

### 7. **Suppliers Module** 🏭

| Feature | Owner | Worker | Notes |
|---------|-------|--------|-------|
| View Suppliers | ✅ Yes | ✅ Yes | Workers can view to check stock sources |
| Add New Supplier | ✅ Yes | ❌ Request Approval | Supplier additions need approval |
| Edit Supplier Info | ✅ Yes | ❌ Request Approval | Changes need approval |
| Delete Supplier | ✅ Yes | ❌ No Access | Only owner can delete |
| View Supplier History | ✅ Yes | ✅ Yes | Both can view |
| Manage Credit Terms | ✅ Yes | ❌ No Access | Only owner sets terms |

**Access**: Workers have READ-ONLY access

**Implementation Needed**:
- ⏳ Hide all "Add/Edit/Delete" buttons for workers
- ⏳ Show "Suggest Supplier" option for workers
- ⏳ Lock credit terms fields for workers

---

### 8. **Purchases Module** 🛍️

| Feature | Owner | Worker | Notes |
|---------|-------|--------|-------|
| View Purchases | ✅ Yes | ✅ Yes | Workers can view to check incoming stock |
| Create Purchase Order | ✅ Yes | ❌ No Access | Only owner creates POs |
| Edit Purchase Order | ✅ Yes | ❌ No Access | Only owner edits |
| Receive Stock | ✅ Yes | ✅ Yes | Workers can mark received (with verification) |
| Delete Purchase | ✅ Yes | ❌ No Access | Only owner can delete |
| View Purchase History | ✅ Yes | ✅ Yes | Both can view |

**Access**: Workers have READ-ONLY, can mark "Received" only

**Implementation Needed**:
- ⏳ Hide "Create PO" and "Edit" buttons for workers
- ⏳ Show "Mark Received" button for workers
- ⏳ Add verification step when worker marks received

---

### 9. **Online Banking / Mobile Services** 💳

| Feature | Owner | Worker | Notes |
|---------|-------|--------|-------|
| View Transactions | ✅ Yes | ✅ Yes | Both can view |
| Process EasyPaisa | ✅ Yes | ✅ Yes | Workers can process transactions |
| Process JazzCash | ✅ Yes | ✅ Yes | Workers can process transactions |
| Process Mobile Load | ✅ Yes | ✅ Yes | Workers can sell mobile load |
| View Commission | ✅ All | 🟡 Own Only | Workers see only their commission |
| Delete Transaction | ✅ Yes | ❌ No Access | Only owner can delete |
| Export Data | ✅ Yes | ❌ No Access | Only owner exports |

**Access**: Workers have FULL operational access, limited to view own commission

**Implementation Needed**:
- ⏳ Filter commission view by worker
- ⏳ Hide "Delete" button for workers
- ⏳ Hide "Export" button for workers

---

### 10. **Daily Closing** 📅

| Feature | Owner | Worker | Notes |
|---------|-------|--------|-------|
| View Daily Closing | ✅ Yes | ✅ Yes | Both can view |
| Create Daily Closing | ✅ Yes | ❌ No Access | Only owner closes the day |
| Submit End-of-Day Report | ✅ Yes | ✅ Yes | Workers can submit their report |
| Edit Closing | ✅ Yes | ❌ No Access | Only owner edits |
| Delete Closing | ✅ Yes | ❌ No Access | Only owner deletes |
| View Reports | ✅ Yes | 🟡 Limited | Workers see basic reports only |

**Access**: Workers can VIEW and SUBMIT reports, cannot CREATE/EDIT/DELETE

**Implementation Needed**:
- ⏳ Add "Submit Worker Report" for workers
- ⏳ Hide "Create Closing" button for workers
- ⏳ Show read-only view of closing for workers

---

### 11. **Reports & Analytics** 📈

| Feature | Owner | Worker | Notes |
|---------|-------|--------|-------|
| Sales Reports (All) | ✅ Yes | ❌ No | Only owner sees all sales |
| Sales Reports (Own) | ✅ Yes | ✅ Yes | Workers see their own performance |
| Profit/Loss Reports | ✅ Yes | ❌ No | Only owner sees financials |
| Inventory Reports | ✅ Yes | ✅ Yes | Both can view stock reports |
| Customer Reports | ✅ Yes | ✅ Yes | Both can view |
| Commission Reports | ✅ All Workers | 🟡 Own Only | Workers see only their commission |
| Export Any Report | ✅ Yes | ❌ No | Only owner exports |
| Custom Reports | ✅ Yes | ❌ No | Only owner creates custom reports |

**Access**: Workers have LIMITED access to own performance only

**Implementation Needed**:
- ⏳ Create separate report pages for workers
- ⏳ Filter all reports by sellerId for workers
- ⏳ Hide profit margins from workers
- ⏳ Hide "Export" button for workers

---

### 12. **Shop Settings** ⚙️

| Feature | Owner | Worker | Notes |
|---------|-------|--------|-------|
| View Settings | ✅ Yes | ❌ No | Only owner views settings |
| Edit Business Info | ✅ Yes | ❌ No | Only owner edits |
| Edit Receipt Config | ✅ Yes | ❌ No | Only owner configures receipts |
| Payment Methods | ✅ Yes | ❌ No | Only owner enables/disables |
| Tax Settings | ✅ Yes | ❌ No | Only owner sets tax rates |
| System Preferences | ✅ Yes | ❌ No | Only owner configures |
| Manage Workers | ✅ Yes | ❌ No | Only owner adds/removes workers |
| Set Permissions | ✅ Yes | ❌ No | Only owner manages permissions |

**Access**: Workers have NO ACCESS to settings

**Implementation Needed**:
- ✅ Already implemented - settings page requires SHOP_OWNER role
- ⏳ Remove settings link from worker sidebar (if present)

---

### 13. **Worker Management** 👥

| Feature | Owner | Worker | Notes |
|---------|-------|--------|-------|
| View Workers List | ✅ Yes | ❌ No | Only owner sees all workers |
| Add Worker | ✅ Yes | ❌ No | Only owner adds workers |
| Edit Worker Info | ✅ Yes | ❌ No | Only owner edits |
| Delete Worker | ✅ Yes | ❌ No | Only owner removes workers |
| Set Permissions | ✅ Yes | ❌ No | Only owner sets permissions |
| View Worker Performance | ✅ Yes | ❌ No | Only owner sees all performance |
| View Own Performance | ✅ Yes | ✅ Yes | Workers see their own stats |

**Access**: Workers have NO ACCESS except to view own profile/performance

**Implementation Needed**:
- ⏳ Create Settings > Workers page for owner
- ⏳ Worker permission matrix UI
- ⏳ Worker performance reports for owner
- ⏳ Remove worker management from worker sidebar

---

### 14. **Approvals Dashboard** ✅

| Feature | Owner | Worker | Notes |
|---------|-------|--------|-------|
| View All Pending Approvals | ✅ Yes | ❌ No | Only owner sees all requests |
| View Own Requests | ✅ Yes | ✅ Yes | Workers see their requests |
| Approve Requests | ✅ Yes | ❌ No | Only owner approves |
| Reject Requests | ✅ Yes | ❌ No | Only owner rejects |
| Submit New Request | N/A | ✅ Yes | Workers submit requests |
| Cancel Own Request | N/A | ✅ Yes | Workers can cancel pending requests |

**Access**: Owner has full approval dashboard, Workers have request submission

**Implementation Needed**:
- ⏳ Create /approvals page for owner
- ⏳ Add "My Requests" view for workers
- ⏳ Add approval/rejection workflow
- ⏳ Real-time notifications

---

## 🎯 Summary: What Workers CAN Do

### ✅ **Full Access (No Restrictions)**:
1. **POS** - Make sales (core function)
2. **View Products** - Check product details and stock
3. **View Inventory** - Check stock levels
4. **Add Customers** - Create new customer records
5. **View Customers** - Access customer information
6. **Process Mobile Services** - EasyPaisa, JazzCash, Mobile Load
7. **View Own Sales** - See their own transaction history
8. **View Own Performance** - Check their own metrics and commission

### 🟡 **Partial Access (With Approval)**:
1. **Add Products** - Submit request to add new products
2. **Edit Products** - Request to modify product details
3. **Adjust Stock** - Request stock adjustments
4. **Edit Customers** - Request to modify customer info
5. **Add Suppliers** - Suggest new suppliers
6. **Large Discounts** - Request discounts > threshold
7. **Refunds** - Request refund processing

### ❌ **No Access (Owner Only)**:
1. **Shop Settings** - All configuration
2. **Worker Management** - Add/remove workers
3. **Delete Anything** - Products, customers, sales, etc.
4. **Financial Reports** - Profit/loss, all sales data
5. **Export Data** - CSV exports
6. **Purchases** - Create purchase orders
7. **Daily Closing** - Create/edit closing records
8. **System Configuration** - Tax rates, payment methods, etc.

---

## 🔧 Implementation Priority

### **Phase 1: Critical (Week 1)** 🔥
- [x] Add sellerId to sales tracking
- [x] Create worker dashboard API
- [x] Connect worker dashboard to real data
- [ ] Hide sensitive buttons from worker UI
- [ ] Create permission middleware
- [ ] Implement API-level permission checks

### **Phase 2: Essential (Week 2)** ⚡
- [ ] Create approval request submission UI
- [ ] Create owner approval dashboard
- [ ] Implement approval workflow (approve/reject)
- [ ] Add "Request" buttons for workers
- [ ] Filter reports by worker

### **Phase 3: Important (Week 3)** 📊
- [ ] Worker permission management UI
- [ ] Granular permission settings per worker
- [ ] Real-time notifications for approvals
- [ ] Worker performance reports for owner

### **Phase 4: Enhancement (Week 4)** ✨
- [ ] Worker activity logging
- [ ] Advanced analytics
- [ ] Mobile app for workers
- [ ] Training mode

---

## 💡 Key Principles

1. **Default Deny**: Workers can't do anything unless explicitly granted
2. **Approval First**: Sensitive operations require owner approval
3. **Track Everything**: All worker actions are logged
4. **Own Data Only**: Workers see only their own sales/performance
5. **No Financial Access**: Workers don't see profit margins or shop-wide finances
6. **Safety**: Workers can't delete or irreversibly change data

---

**Next Steps**: 
1. Review this matrix
2. Confirm access levels are correct
3. Start implementing permission middleware
4. Begin UI modifications to hide restricted features
