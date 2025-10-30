# Mobile Shop Management System - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## 🏗️ Project Overview
This is a comprehensive mobile shop management system built with Next.js 14+, TypeScript, and modern web technologies for managing multiple mobile phone retail shops across Pakistan.

## 🎯 Core Business Modules

### 1. **POS (Point of Sale) System**
- Real-time transaction processing
- Barcode scanning integration
- Receipt generation and printing
- Tax calculation (GST compliance)
- Customer information management
- Multi-payment method support

### 2. **Supplier Management**
- Vendor registration and verification
- Purchase order management
- Supplier payment tracking
- Credit terms management
- Performance analytics
- Contact and communication history

### 3. **Product Management**
- Mobile device catalog with specifications
- IMEI tracking for individual devices
- Warranty management
- Price management with markup controls
- Stock alerts and reordering
- Product image and document management

### 4. **Category Management**
- Hierarchical product categorization
- Brand management (Samsung, Apple, Xiaomi, etc.)
- Model variant tracking
- Feature-based filtering
- Price range categorization

### 5. **Inventory Management**
- Real-time stock tracking
- Multi-location inventory
- Stock transfer between shops
- Automated reorder points
- Damage/return handling
- Expiry and warranty tracking

### 6. **Sales Management**
- Daily/weekly/monthly sales reports
- Sales representative performance
- Customer purchase history
- Profit margin analysis
- Return and exchange management
- Installment plan tracking

### 7. **Payment Integration**
- **EasyPaisa**: Mobile wallet integration
- **JazzCash**: Mobile wallet integration
- **Bank Transfer**: Direct banking
- **Cash**: Traditional payment
- **Card**: Credit/Debit card processing
- **Installments**: EMI management

### 8. **Daily Closing Module**
- End-of-day cash reconciliation
- Sales summary generation
- Expense tracking
- Profit/loss calculation
- Bank deposit records
- Cash-in-hand tracking

### 9. **Loan Module**
- Customer credit assessment
- Installment plan creation
- Payment tracking and reminders
- Default management
- Credit history maintenance
- Interest calculation

## 🏢 Multi-Level Authentication Architecture

### **Level 1: Super Admin**
- **Role**: System Administrator
- **Scope**: Global system access
- **Responsibilities**:
  - Create and manage shop accounts
  - Assign shop owners
  - System-wide configuration
  - Master data management
  - System monitoring and analytics
  - Backup and security management
- **Access Level**: Full CRUD on all modules across all shops
- **UI Access**: Super admin dashboard with multi-shop overview

### **Level 2: Shop Owner/Admin**
- **Role**: Shop Administrator
- **Scope**: Single shop access
- **Responsibilities**:
  - Manage shop operations
  - Create worker accounts (max 2 per shop)
  - Financial oversight and reporting
  - Inventory management
  - Supplier relationship management
  - Daily closing approval
- **Access Level**: Full CRUD within their shop's data
- **Worker Management**: Can add/remove/modify worker permissions
- **UI Access**: Shop admin dashboard with full operational controls

### **Level 3: Shop Workers**
- **Role**: Operational Staff
- **Scope**: Limited shop access (max 2 per shop)
- **Responsibilities**:
  - POS operations and sales
  - Customer service
  - Basic inventory updates
  - Product entry (with approval)
  - Daily sales reporting
- **Access Level**: 
  - **Read**: All shop data
  - **Create**: Sales, customers, basic inventory entries
  - **Update**: Limited to own entries, requires shop owner approval for critical changes
  - **Delete**: No delete access, must request shop owner approval
- **Approval Workflow**: All updates/deletes must be approved by shop owner
- **UI Access**: Simplified dashboard focused on daily operations

## 🔐 Permission Matrix

| Function | Super Admin | Shop Owner | Worker |
|----------|-------------|------------|---------|
| Shop Management | Full CRUD | View Own | No Access |
| User Management | Full CRUD | Workers Only | No Access |
| Product Catalog | Full CRUD | Full CRUD | Create/Read (Update/Delete with approval) |
| Inventory | Full CRUD | Full CRUD | Create/Read (Update/Delete with approval) |
| Sales | Full CRUD | Full CRUD | Create/Read (Update/Delete with approval) |
| Suppliers | Full CRUD | Full CRUD | Read Only |
| Financial Reports | All Shops | Own Shop | Basic Reports |
| Daily Closing | All Shops | Own Shop | Submit Only |
| Payments | All Shops | Own Shop | Process Only |
| Loans | All Shops | Own Shop | Read Only |

## 🏗️ High-Level Architecture

### **Frontend Layer (Next.js 14+)**
```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
├─────────────────────────────────────────────────────────────┤
│  Dashboard  │  POS  │  Inventory  │  Reports  │  Settings   │
├─────────────────────────────────────────────────────────────┤
│         Component Library (shadcn/ui + Custom)              │
├─────────────────────────────────────────────────────────────┤
│    State Management (Zustand + React Query + Context)       │
└─────────────────────────────────────────────────────────────┘
```

### **API Layer (Next.js API Routes)**
```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
├─────────────────────────────────────────────────────────────┤
│  Auth  │  POS  │  Inventory  │  Payments  │  Reports       │
├─────────────────────────────────────────────────────────────┤
│              Middleware (Auth, Validation, Logging)         │
├─────────────────────────────────────────────────────────────┤
│                   Business Logic Layer                      │
└─────────────────────────────────────────────────────────────┘
```

### **Data Layer**
```
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                    │
├─────────────────────────────────────────────────────────────┤
│  Users  │  Shops  │  Products  │  Sales  │  Inventory      │
├─────────────────────────────────────────────────────────────┤
│                      Prisma ORM                             │
└─────────────────────────────────────────────────────────────┘
```

### **External Integrations**
```
┌─────────────────────────────────────────────────────────────┐
│               Payment Gateways                              │
├─────────────────────────────────────────────────────────────┤
│  EasyPaisa API  │  JazzCash API  │  Bank APIs              │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Technology Stack

### **Frontend Technologies**
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v3 + CSS Variables
- **UI Components**: shadcn/ui + Custom components
- **Icons**: Lucide React
- **Charts**: Recharts or Chart.js
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns

### **Backend Technologies**
- **API**: Next.js API Routes (RESTful)
- **Database**: PostgreSQL 15+
- **ORM**: Prisma with type-safe queries
- **Authentication**: NextAuth.js v4
- **File Upload**: Next.js built-in or Cloudinary
- **PDF Generation**: jsPDF or Puppeteer

### **State Management**
- **Global State**: Zustand for complex state
- **Server State**: TanStack Query (React Query)
- **Form State**: React Hook Form
- **Authentication**: NextAuth + React Context

### **Development Tools**
- **Type Safety**: TypeScript with strict configuration
- **Linting**: ESLint with custom rules
- **Formatting**: Prettier
- **Testing**: Jest + React Testing Library
- **API Testing**: Postman/Insomnia collections

## 📁 Detailed File Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/              # Main application routes
│   │   ├── dashboard/            # Dashboard pages
│   │   ├── pos/                  # Point of Sale
│   │   ├── inventory/            # Inventory management
│   │   ├── products/             # Product management
│   │   ├── suppliers/            # Supplier management
│   │   ├── sales/                # Sales management
│   │   ├── reports/              # Reports and analytics
│   │   ├── loans/                # Loan management
│   │   ├── settings/             # System settings
│   │   └── layout.tsx
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication APIs
│   │   ├── shops/                # Shop management
│   │   ├── users/                # User management
│   │   ├── products/             # Product APIs
│   │   ├── inventory/            # Inventory APIs
│   │   ├── sales/                # Sales APIs
│   │   ├── suppliers/            # Supplier APIs
│   │   ├── payments/             # Payment processing
│   │   ├── reports/              # Report generation
│   │   └── loans/                # Loan management
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── forms/                    # Form components
│   │   ├── LoginForm.tsx
│   │   ├── ProductForm.tsx
│   │   ├── SaleForm.tsx
│   │   └── ...
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── DashboardLayout.tsx
│   ├── pos/                      # POS specific components
│   │   ├── Cart.tsx
│   │   ├── ProductSearch.tsx
│   │   ├── PaymentModal.tsx
│   │   └── Receipt.tsx
│   └── reports/                  # Report components
│       ├── SalesChart.tsx
│       ├── InventoryTable.tsx
│       └── FinancialSummary.tsx
├── lib/                          # Utility functions
│   ├── auth.ts                   # Authentication config
│   ├── db.ts                     # Database connection
│   ├── utils.ts                  # General utilities
│   ├── validations/              # Zod schemas
│   │   ├── auth.ts
│   │   ├── product.ts
│   │   ├── sale.ts
│   │   └── ...
│   └── payments/                 # Payment integrations
│       ├── easypaisa.ts
│       ├── jazzcash.ts
│       └── bank.ts
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts
│   ├── use-local-storage.ts
│   ├── use-cart.ts
│   └── use-permissions.ts
├── store/                        # Zustand stores
│   ├── auth-store.ts
│   ├── cart-store.ts
│   ├── inventory-store.ts
│   └── ui-store.ts
├── types/                        # TypeScript type definitions
│   ├── auth.ts
│   ├── product.ts
│   ├── sale.ts
│   ├── shop.ts
│   ├── user.ts
│   └── payment.ts
└── constants/                    # Application constants
    ├── permissions.ts
    ├── roles.ts
    ├── payment-methods.ts
    └── api-endpoints.ts
```

## 🔧 Development Guidelines

### **Code Quality Standards**
1. **Type Safety**: 100% TypeScript coverage, no `any` types
2. **Component Design**: Functional components with TypeScript interfaces
3. **Error Handling**: Comprehensive try-catch with user-friendly messages
4. **Performance**: Code splitting, lazy loading, and optimization
5. **Testing**: Unit tests for utilities, integration tests for APIs
6. **Documentation**: JSDoc comments for all functions and components

### **Database Design Principles**
1. **Normalization**: Proper relational design with foreign keys
2. **Indexing**: Strategic indexing for query performance
3. **Transactions**: ACID compliance for financial operations
4. **Audit Trail**: Track all changes with user and timestamp
5. **Soft Deletes**: Preserve data integrity with deletion flags
6. **Backup Strategy**: Automated daily backups with retention

### **Security Implementation**
1. **Authentication**: JWT tokens with refresh mechanism
2. **Authorization**: Role-based access control (RBAC)
3. **Input Validation**: Server-side validation with Zod
4. **SQL Injection**: Parameterized queries through Prisma
5. **XSS Protection**: Input sanitization and CSP headers
6. **HTTPS**: SSL/TLS enforcement in production

### **Performance Optimization**
1. **Server-Side Rendering**: Strategic SSR for SEO and performance
2. **Caching**: Redis for session and frequently accessed data
3. **Database Optimization**: Query optimization and connection pooling
4. **Asset Optimization**: Image compression and CDN integration
5. **Bundle Optimization**: Tree shaking and code splitting
6. **Monitoring**: Performance monitoring and error tracking

### **Pakistani Market Considerations**
1. **Currency**: PKR formatting and calculations
2. **Tax System**: GST compliance and reporting
3. **Language**: Urdu support for customer-facing content
4. **Payment Methods**: Local payment gateway integrations
5. **Business Practices**: Local business workflows and requirements
6. **Mobile-First**: Optimized for mobile and tablet use in shops

### **Approval Workflow for Workers**
1. **Change Requests**: Workers submit change requests for updates/deletes
2. **Notification System**: Shop owners receive instant notifications
3. **Review Interface**: Easy approval/rejection interface for shop owners
4. **Audit Trail**: Complete history of all change requests and approvals
5. **Auto-Approval**: Configurable rules for minor changes
6. **Escalation**: Automated escalation for pending approvals

## 📊 Business Logic Rules

### **Inventory Rules**
- Automatic stock deduction on sales
- Low stock alerts at configurable thresholds
- FIFO/LIFO costing methods
- Damage/return stock handling
- Inter-shop stock transfers with approval

### **Pricing Rules**
- Dynamic pricing based on cost + markup
- Bulk discount configurations
- Seasonal pricing adjustments
- Customer-specific pricing tiers
- Supplier-specific cost tracking

### **Financial Rules**
- Daily closing mandatory before new day operations
- Cash float management
- Petty cash expense tracking
- Bank reconciliation processes
- Tax calculation and reporting

### **Loan Management Rules**
- Credit limit enforcement
- Interest calculation (simple/compound)
- Payment schedule generation
- Default handling procedures
- Collection reminder automation

Remember: This system manages real financial transactions and inventory for multiple retail shops. Ensure all code follows Pakistani business practices, implements proper security measures, and maintains data integrity at all times.
