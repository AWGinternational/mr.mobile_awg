-- =====================================================
-- ROW LEVEL SECURITY (RLS) - FINAL PRODUCTION VERSION
-- =====================================================
-- All Supabase advisor issues resolved ✅
-- =====================================================

-- Step 1: Enable RLS on all tables
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_worker_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- Step 2: Create helper functions with explicit search_path safety
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_shop_ids(user_id TEXT)
RETURNS TABLE(shop_id TEXT) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Shops owned by user
  SELECT s.id::TEXT
  FROM shops s
  WHERE s."ownerId" = user_id
  
  UNION
  
  -- Shops where user is a worker
  SELECT sw."shopId"::TEXT
  FROM shop_workers sw
  WHERE sw."userId" = user_id AND sw."isActive" = true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_super_admin(user_id TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND role = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql;

-- Step 3: SECURE helper functions (CRITICAL)
-- =====================================================

REVOKE EXECUTE ON FUNCTION get_user_shop_ids(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION is_super_admin(TEXT) FROM PUBLIC, anon, authenticated;

-- Grant execute to service_role (conditional, only if role exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION get_user_shop_ids(TEXT) TO service_role;
    GRANT EXECUTE ON FUNCTION is_super_admin(TEXT) TO service_role;
  END IF;
END $$;

-- Step 4: Create restrictive policies for anon/authenticated
-- =====================================================
-- Blocks anon/authenticated roles, allows service_role (Prisma)

-- Users
CREATE POLICY "users_restrict_anon" ON users
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Sessions
CREATE POLICY "sessions_restrict_anon" ON sessions
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Shops
CREATE POLICY "shops_restrict_anon" ON shops
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Shop Workers
CREATE POLICY "shop_workers_restrict_anon" ON shop_workers
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- User Module Access
CREATE POLICY "user_module_access_restrict_anon" ON user_module_access
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Shop Worker Module Access
CREATE POLICY "shop_worker_module_access_restrict_anon" ON shop_worker_module_access
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Categories
CREATE POLICY "categories_restrict_anon" ON categories
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Brands
CREATE POLICY "brands_restrict_anon" ON brands
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Products
CREATE POLICY "products_restrict_anon" ON products
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Inventory Items
CREATE POLICY "inventory_items_restrict_anon" ON inventory_items
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Cart Items
CREATE POLICY "cart_items_restrict_anon" ON cart_items
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Suppliers
CREATE POLICY "suppliers_restrict_anon" ON suppliers
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Purchases
CREATE POLICY "purchases_restrict_anon" ON purchases
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Purchase Payments
CREATE POLICY "purchase_payments_restrict_anon" ON purchase_payments
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Purchase Items
CREATE POLICY "purchase_items_restrict_anon" ON purchase_items
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Customers
CREATE POLICY "customers_restrict_anon" ON customers
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Sales
CREATE POLICY "sales_restrict_anon" ON sales
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Sale Items
CREATE POLICY "sale_items_restrict_anon" ON sale_items
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Payments
CREATE POLICY "payments_restrict_anon" ON payments
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Loans
CREATE POLICY "loans_restrict_anon" ON loans
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Loan Installments
CREATE POLICY "loan_installments_restrict_anon" ON loan_installments
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Daily Closings
CREATE POLICY "daily_closings_restrict_anon" ON daily_closings
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Expenses
CREATE POLICY "expenses_restrict_anon" ON expenses
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Sales Predictions
CREATE POLICY "sales_predictions_restrict_anon" ON sales_predictions
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Customer Insights
CREATE POLICY "customer_insights_restrict_anon" ON customer_insights
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Stock Recommendations
CREATE POLICY "stock_recommendations_restrict_anon" ON stock_recommendations
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Audit Logs
CREATE POLICY "audit_logs_restrict_anon" ON audit_logs
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Approval Requests
CREATE POLICY "approval_requests_restrict_anon" ON approval_requests
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Mobile Services
CREATE POLICY "mobile_services_restrict_anon" ON mobile_services
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Messages
CREATE POLICY "messages_restrict_anon" ON messages
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Message Reads
CREATE POLICY "message_reads_restrict_anon" ON message_reads
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- =====================================================
-- COMPLETION ✅
-- =====================================================
-- RLS enabled on all 31 tables
-- Helper functions secured
-- Policies block anon/authenticated
-- Service role (Prisma) bypasses RLS automatically
-- All Supabase advisor issues resolved ✅
-- =====================================================

