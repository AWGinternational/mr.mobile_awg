# Mobile Shop Management System - Database Schema

## 🗄️ Complete Database Design

This document outlines the complete database schema for the mobile shop management system with multi-tenant architecture, AI/ML support, and comprehensive business logic.

## 🏗️ Database Strategy

- **Multi-Tenant Architecture**: Separate database per shop for complete data isolation
- **Master Database**: Central system database for super admin operations
- **AI Database**: Centralized analytics and ML model storage
- **Audit Database**: Comprehensive audit trail storage

---

## 📊 Master System Database Schema

### 1. Super Admin & System Management

```sql
-- Super Admin Users
CREATE TABLE super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop Registry (Master list of all shops)
CREATE TABLE shops_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_code VARCHAR(20) UNIQUE NOT NULL, -- AUTO: SH001, SH002, etc.
    shop_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255) UNIQUE NOT NULL,
    owner_phone VARCHAR(20) NOT NULL,
    owner_cnic VARCHAR(15) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    database_name VARCHAR(100) UNIQUE NOT NULL, -- shop_sh001_db
    database_connection_string TEXT,
    is_active BOOLEAN DEFAULT true,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES super_admins(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Configuration
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    updated_by UUID REFERENCES super_admins(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master Brand Registry (Shared across all shops)
CREATE TABLE master_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master Category Registry
CREATE TABLE master_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES master_categories(id),
    level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Audit Log
CREATE TABLE system_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops_registry(id),
    user_id UUID,
    user_type VARCHAR(20), -- super_admin, shop_owner, manager, worker
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🏪 Individual Shop Database Schema

Each shop has its own database with the following schema:

### 2. Authentication & User Management

```sql
-- Shop Users (Owner + Workers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    cnic VARCHAR(15),
    role VARCHAR(20) NOT NULL, -- shop_owner, manager, worker
    permissions JSONB, -- Detailed permission structure
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_role CHECK (role IN ('shop_owner', 'manager', 'worker')),
    CONSTRAINT check_worker_limit CHECK (
        (SELECT COUNT(*) FROM users WHERE role IN ('manager', 'worker') AND is_active = true) <= 2
        OR role = 'shop_owner'
    )
);

-- User Sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker Approval Requests
CREATE TABLE approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id),
    approver_id UUID REFERENCES users(id),
    request_type VARCHAR(50) NOT NULL, -- update_product, delete_product, return_item, etc.
    table_name VARCHAR(100),
    record_id UUID,
    current_data JSONB,
    requested_changes JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, expired
    reason TEXT,
    approved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_approval_status CHECK (status IN ('pending', 'approved', 'rejected', 'expired'))
);
```

### 3. Product Management & Inventory

```sql
-- Brands (Shop-specific)
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (Hierarchical)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES categories(id),
    level INTEGER DEFAULT 1,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    payment_terms VARCHAR(50), -- net_30, net_15, cash, etc.
    credit_limit DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Master
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL, -- Auto-generated or manual
    name VARCHAR(255) NOT NULL,
    brand_id UUID REFERENCES brands(id),
    category_id UUID REFERENCES categories(id),
    product_type VARCHAR(50) NOT NULL, -- mobile, accessory, case, screen_protector, etc.
    
    -- Mobile-specific fields
    model VARCHAR(100),
    storage_capacity VARCHAR(20), -- 128GB, 256GB, etc.
    ram VARCHAR(20), -- 6GB, 8GB, etc.
    color VARCHAR(50),
    network_type VARCHAR(20), -- 4G, 5G
    operating_system VARCHAR(50),
    
    -- General product fields
    description TEXT,
    specifications JSONB,
    images JSONB, -- Array of image URLs
    documents JSONB, -- Array of document URLs
    
    -- Pricing
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    markup_percentage DECIMAL(5,2),
    min_selling_price DECIMAL(10,2),
    
    -- Inventory settings
    track_imei BOOLEAN DEFAULT false,
    track_serial BOOLEAN DEFAULT false,
    low_stock_threshold INTEGER DEFAULT 5,
    reorder_point INTEGER DEFAULT 10,
    reorder_quantity INTEGER DEFAULT 20,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_product_type CHECK (product_type IN ('mobile', 'accessory', 'case', 'screen_protector', 'charger', 'cable', 'earphone', 'other'))
);

-- Product Variants (for different colors, storage, etc.)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    specifications JSONB,
    images JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Items (Individual tracking with IMEI)
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    
    -- Unique identifiers
    imei_1 VARCHAR(20), -- Primary IMEI
    imei_2 VARCHAR(20), -- Secondary IMEI for dual SIM
    serial_number VARCHAR(100),
    barcode VARCHAR(100),
    
    -- Cost tracking (FIFO)
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'in_stock', -- in_stock, sold, damaged, returned, reserved
    condition_status VARCHAR(20) DEFAULT 'new', -- new, refurbished, damaged, defective
    
    -- Location tracking
    location VARCHAR(100), -- shelf_a1, storage_room, display, etc.
    
    -- Purchase information
    supplier_id UUID REFERENCES suppliers(id),
    purchase_order_id UUID,
    received_date DATE,
    
    -- Warranty information
    warranty_months INTEGER,
    warranty_start_date DATE,
    warranty_end_date DATE,
    
    -- Sale information
    sold_at TIMESTAMPTZ,
    sold_to_customer_id UUID,
    sale_id UUID,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_inventory_status CHECK (status IN ('in_stock', 'sold', 'damaged', 'returned', 'reserved', 'transfer_out', 'transfer_in')),
    CONSTRAINT check_condition_status CHECK (condition_status IN ('new', 'refurbished', 'damaged', 'defective'))
);

-- Stock Summary (Calculated view for quick access)
CREATE TABLE stock_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) UNIQUE,
    total_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER DEFAULT 0,
    sold_quantity INTEGER DEFAULT 0,
    damaged_quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    average_cost DECIMAL(10,2),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Sales & Customer Management

```sql
-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    cnic VARCHAR(15),
    address TEXT,
    city VARCHAR(100),
    
    -- Customer segmentation
    customer_type VARCHAR(20) DEFAULT 'regular', -- regular, vip, wholesale
    credit_limit DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    
    -- Purchase behavior (for AI)
    total_purchases DECIMAL(12,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    first_purchase_date DATE,
    last_purchase_date DATE,
    average_order_value DECIMAL(10,2),
    preferred_brands JSONB,
    
    -- Credit assessment
    credit_score INTEGER, -- 1-10 internal scoring
    payment_behavior VARCHAR(20) DEFAULT 'unknown', -- excellent, good, average, poor
    
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_customer_type CHECK (customer_type IN ('regular', 'vip', 'wholesale')),
    CONSTRAINT check_payment_behavior CHECK (payment_behavior IN ('excellent', 'good', 'average', 'poor', 'unknown'))
);

-- Sales Transactions
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number VARCHAR(50) UNIQUE NOT NULL, -- Auto: SAL-2024-001
    
    -- Customer information
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255), -- Cached for quick access
    customer_phone VARCHAR(20),
    
    -- Sale details
    total_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    
    -- Payment information
    payment_status VARCHAR(20) DEFAULT 'paid', -- paid, partial, pending, credit
    paid_amount DECIMAL(12,2) DEFAULT 0,
    balance_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Sale metadata
    sale_type VARCHAR(20) DEFAULT 'retail', -- retail, wholesale, return, exchange
    sale_date DATE NOT NULL,
    
    -- Staff information
    sales_person_id UUID REFERENCES users(id),
    sales_person_name VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed', -- completed, cancelled, returned
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_payment_status CHECK (payment_status IN ('paid', 'partial', 'pending', 'credit')),
    CONSTRAINT check_sale_type CHECK (sale_type IN ('retail', 'wholesale', 'return', 'exchange')),
    CONSTRAINT check_sale_status CHECK (status IN ('completed', 'cancelled', 'returned'))
);

-- Sale Items
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    
    -- Product information
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    inventory_item_id UUID REFERENCES inventory_items(id),
    
    -- Cached product info
    product_name VARCHAR(255),
    product_sku VARCHAR(100),
    imei_1 VARCHAR(20),
    imei_2 VARCHAR(20),
    
    -- Pricing
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost DECIMAL(10,2), -- For profit calculation
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Profit calculation
    profit_amount DECIMAL(10,2),
    profit_margin DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id),
    
    -- Payment details
    payment_method VARCHAR(30) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    
    -- Mobile payment details
    phone_number VARCHAR(20), -- For EasyPaisa, JazzCash
    transaction_id VARCHAR(100), -- External transaction ID
    reference_number VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed', -- completed, pending, failed, cancelled
    
    -- Fees and charges
    fee_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(12,2),
    
    -- Audit
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    CONSTRAINT check_payment_method CHECK (payment_method IN ('cash', 'jazzcash', 'easypaisa', 'bank_transfer', 'card', 'uload', 'jazz_load', 'zong_load', 'telenor_load', 'credit')),
    CONSTRAINT check_payment_status CHECK (status IN ('completed', 'pending', 'failed', 'cancelled'))
);
```

### 5. Daily Operations & Financial Management

```sql
-- Daily Closing
CREATE TABLE daily_closing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closing_date DATE UNIQUE NOT NULL,
    
    -- Sales summary
    total_sales_amount DECIMAL(12,2) DEFAULT 0,
    total_sales_count INTEGER DEFAULT 0,
    total_discount DECIMAL(10,2) DEFAULT 0,
    
    -- Payment method breakdown
    cash_sales DECIMAL(12,2) DEFAULT 0,
    jazzcash_sales DECIMAL(12,2) DEFAULT 0,
    easypaisa_sales DECIMAL(12,2) DEFAULT 0,
    bank_sales DECIMAL(12,2) DEFAULT 0,
    credit_sales DECIMAL(12,2) DEFAULT 0,
    other_sales DECIMAL(12,2) DEFAULT 0,
    
    -- Load/recharge breakdown
    jazz_load DECIMAL(12,2) DEFAULT 0,
    zong_load DECIMAL(12,2) DEFAULT 0,
    telenor_load DECIMAL(12,2) DEFAULT 0,
    uload DECIMAL(12,2) DEFAULT 0,
    
    -- Cash management
    opening_cash DECIMAL(12,2) DEFAULT 0,
    cash_received DECIMAL(12,2) DEFAULT 0,
    cash_paid_out DECIMAL(12,2) DEFAULT 0,
    expected_cash DECIMAL(12,2) DEFAULT 0,
    actual_cash DECIMAL(12,2),
    cash_variance DECIMAL(12,2) DEFAULT 0,
    
    -- Expenses
    total_expenses DECIMAL(10,2) DEFAULT 0,
    
    -- Profit calculation
    total_cost DECIMAL(12,2) DEFAULT 0,
    gross_profit DECIMAL(12,2) DEFAULT 0,
    net_profit DECIMAL(12,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'open', -- open, closed, reconciled
    closed_by UUID REFERENCES users(id),
    closed_at TIMESTAMPTZ,
    
    -- Variance approval
    variance_approved BOOLEAN DEFAULT false,
    variance_approved_by UUID REFERENCES users(id),
    variance_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL,
    
    -- Expense details
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    
    -- Payment method
    payment_method VARCHAR(30) NOT NULL,
    reference_number VARCHAR(100),
    
    -- Approval
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_expense_payment_method CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'other'))
);

-- Purchase Orders
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL, -- Auto: PO-2024-001
    supplier_id UUID REFERENCES suppliers(id),
    
    -- Order details
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Financial
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    balance_amount DECIMAL(12,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, confirmed, received, cancelled
    
    -- Approval
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_po_status CHECK (status IN ('draft', 'sent', 'confirmed', 'received', 'cancelled'))
);

-- Purchase Order Items
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    
    -- Order details
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    
    -- Receiving details
    received_quantity INTEGER DEFAULT 0,
    remaining_quantity INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. Credit & Loan Management

```sql
-- Customer Credit Applications
CREATE TABLE credit_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    
    -- Application details
    requested_amount DECIMAL(12,2) NOT NULL,
    purpose TEXT,
    
    -- Customer financial info
    monthly_income DECIMAL(10,2),
    employment_type VARCHAR(50),
    employer_name VARCHAR(255),
    
    -- Guarantor information (optional)
    guarantor_name VARCHAR(255),
    guarantor_phone VARCHAR(20),
    guarantor_cnic VARCHAR(15),
    guarantor_address TEXT,
    
    -- Documents
    documents JSONB, -- Array of document URLs
    
    -- Assessment
    credit_score INTEGER,
    assessment_notes TEXT,
    approved_amount DECIMAL(12,2),
    interest_rate DECIMAL(5,2),
    term_months INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    
    -- Approval
    assessed_by UUID REFERENCES users(id),
    assessed_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_credit_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

-- Active Loans
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_application_id UUID REFERENCES credit_applications(id),
    customer_id UUID REFERENCES customers(id),
    
    -- Loan details
    loan_number VARCHAR(50) UNIQUE NOT NULL, -- Auto: LN-2024-001
    principal_amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    term_months INTEGER NOT NULL,
    monthly_payment DECIMAL(10,2) NOT NULL,
    
    -- Dates
    start_date DATE NOT NULL,
    first_payment_date DATE NOT NULL,
    final_payment_date DATE NOT NULL,
    
    -- Current status
    outstanding_balance DECIMAL(12,2),
    paid_amount DECIMAL(12,2) DEFAULT 0,
    interest_paid DECIMAL(12,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, paid_off, defaulted, restructured
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_loan_status CHECK (status IN ('active', 'paid_off', 'defaulted', 'restructured'))
);

-- Loan Payments
CREATE TABLE loan_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id),
    
    -- Payment details
    payment_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    
    -- Payment breakdown
    principal_amount DECIMAL(10,2),
    interest_amount DECIMAL(10,2),
    late_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    payment_method VARCHAR(30),
    status VARCHAR(20) DEFAULT 'paid', -- paid, partial, missed, late
    
    -- Late payment tracking
    days_late INTEGER DEFAULT 0,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT check_loan_payment_status CHECK (status IN ('paid', 'partial', 'missed', 'late'))
);
```

### 7. Audit & Logging

```sql
-- Shop Audit Log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(255),
    user_role VARCHAR(20),
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    
    -- Data changes
    old_values JSONB,
    new_values JSONB,
    
    -- Request details
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error Logs
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    error_type VARCHAR(100),
    error_message TEXT,
    stack_trace TEXT,
    request_url TEXT,
    request_method VARCHAR(10),
    request_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🤖 AI/ML Database Schema

### 8. AI Analytics & Machine Learning

```sql
-- AI Sales Predictions
CREATE TABLE ai_sales_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID, -- Reference to shops_registry
    product_id UUID,
    
    -- Prediction details
    prediction_date DATE NOT NULL,
    prediction_period VARCHAR(20), -- next_week, next_month, next_quarter
    predicted_quantity INTEGER,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Factors considered
    historical_data_months INTEGER,
    seasonal_factor DECIMAL(3,2),
    trend_factor DECIMAL(3,2),
    
    -- Model information
    model_version VARCHAR(20),
    model_accuracy DECIMAL(3,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Behavior Analysis
CREATE TABLE ai_customer_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID,
    customer_id UUID,
    
    -- Behavior patterns
    purchase_frequency_days INTEGER,
    preferred_price_range_min DECIMAL(10,2),
    preferred_price_range_max DECIMAL(10,2),
    brand_loyalty_score DECIMAL(3,2),
    upsell_probability DECIMAL(3,2),
    
    -- Predictions
    next_purchase_date DATE,
    recommended_products JSONB,
    churn_probability DECIMAL(3,2),
    lifetime_value DECIMAL(12,2),
    
    -- Analysis metadata
    last_analyzed TIMESTAMPTZ DEFAULT NOW(),
    data_points_used INTEGER
);

-- Market Trend Analysis
CREATE TABLE ai_market_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Trend details
    trend_type VARCHAR(50), -- brand_performance, category_growth, price_trends
    trend_name VARCHAR(100),
    trend_period VARCHAR(20), -- daily, weekly, monthly, quarterly
    
    -- Trend data
    current_value DECIMAL(12,2),
    previous_value DECIMAL(12,2),
    percentage_change DECIMAL(5,2),
    trend_direction VARCHAR(20), -- increasing, decreasing, stable
    
    -- Confidence and impact
    confidence_level DECIMAL(3,2),
    business_impact VARCHAR(20), -- high, medium, low
    
    -- Recommendations
    recommended_action TEXT,
    
    analysis_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Model Performance Tracking
CREATE TABLE ai_model_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    
    -- Performance metrics
    accuracy DECIMAL(3,2),
    precision_score DECIMAL(3,2),
    recall_score DECIMAL(3,2),
    f1_score DECIMAL(3,2),
    
    -- Training details
    training_data_size INTEGER,
    training_date DATE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Deployment status
    is_active BOOLEAN DEFAULT false,
    deployed_at TIMESTAMPTZ
);

-- Smart Reorder Suggestions
CREATE TABLE ai_reorder_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID,
    product_id UUID,
    
    -- Suggestion details
    current_stock INTEGER,
    suggested_order_quantity INTEGER,
    optimal_reorder_point INTEGER,
    
    -- Reasoning
    demand_forecast DECIMAL(8,2),
    lead_time_days INTEGER,
    safety_stock_days INTEGER,
    seasonal_adjustment DECIMAL(3,2),
    
    -- Business impact
    stockout_risk DECIMAL(3,2),
    carrying_cost_impact DECIMAL(10,2),
    opportunity_cost DECIMAL(10,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, expired
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    
    suggestion_date DATE NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📊 Indexes & Performance Optimization

```sql
-- Critical Indexes for Performance

-- Users and Authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_active ON users(role, is_active);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, is_active);

-- Products and Inventory
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_brand_category ON products(brand_id, category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_inventory_items_product ON inventory_items(product_id);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_imei ON inventory_items(imei_1, imei_2);

-- Sales and Transactions
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_person ON sales(sales_person_id);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- Financial
CREATE INDEX idx_payment_transactions_sale ON payment_transactions(sale_id);
CREATE INDEX idx_payment_transactions_method ON payment_transactions(payment_method);
CREATE INDEX idx_daily_closing_date ON daily_closing(closing_date);

-- AI and Analytics
CREATE INDEX idx_ai_predictions_shop_product ON ai_sales_predictions(shop_id, product_id);
CREATE INDEX idx_ai_predictions_date ON ai_sales_predictions(prediction_date);
CREATE INDEX idx_ai_customer_insights_shop_customer ON ai_customer_insights(shop_id, customer_id);

-- Audit and Logging
CREATE INDEX idx_audit_log_user_date ON audit_log(user_id, created_at);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
```

---

## 🔄 Database Functions & Triggers

```sql
-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Stock summary update function
CREATE OR REPLACE FUNCTION update_stock_summary()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO stock_summary (product_id, total_quantity, available_quantity, sold_quantity, damaged_quantity, last_updated)
    SELECT 
        product_id,
        COUNT(*) as total_quantity,
        COUNT(*) FILTER (WHERE status = 'in_stock') as available_quantity,
        COUNT(*) FILTER (WHERE status = 'sold') as sold_quantity,
        COUNT(*) FILTER (WHERE status = 'damaged') as damaged_quantity,
        NOW()
    FROM inventory_items 
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    GROUP BY product_id
    ON CONFLICT (product_id) 
    DO UPDATE SET 
        total_quantity = EXCLUDED.total_quantity,
        available_quantity = EXCLUDED.available_quantity,
        sold_quantity = EXCLUDED.sold_quantity,
        damaged_quantity = EXCLUDED.damaged_quantity,
        last_updated = EXCLUDED.last_updated;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply stock summary trigger
CREATE TRIGGER update_stock_on_inventory_change 
    AFTER INSERT OR UPDATE OR DELETE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_stock_summary();
```

---

## 📝 Database Migration Strategy

### Initial Setup
1. Create master system database
2. Run master schema migrations
3. Set up shop database templates
4. Create AI analytics database

### Shop Database Creation Process
1. Clone template database for new shop
2. Apply shop-specific configurations
3. Create initial admin user
4. Set up audit logging
5. Initialize stock summary tables

### Data Backup Strategy
- **Daily**: Automated full backup of each shop database
- **Weekly**: Cross-region backup replication
- **Monthly**: Archived backups with 12-month retention
- **Real-time**: Transaction log shipping for critical data

---

This comprehensive database schema supports:
- ✅ Multi-tenant architecture with complete data isolation
- ✅ AI/ML analytics and predictions
- ✅ Complex inventory management with IMEI tracking
- ✅ Financial management and daily closing
- ✅ Credit and loan management
- ✅ Comprehensive audit trails
- ✅ Performance optimization with strategic indexing
- ✅ Pakistani mobile shop business requirements

**Next Document**: API Endpoint Specifications with detailed request/response examples.
