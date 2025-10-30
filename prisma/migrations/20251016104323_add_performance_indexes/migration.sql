-- CreateIndex
CREATE INDEX "customers_shopId_name_idx" ON "customers"("shopId", "name");

-- CreateIndex
CREATE INDEX "customers_shopId_phone_idx" ON "customers"("shopId", "phone");

-- CreateIndex
CREATE INDEX "inventory_items_productId_status_idx" ON "inventory_items"("productId", "status");

-- CreateIndex
CREATE INDEX "inventory_items_shopId_status_idx" ON "inventory_items"("shopId", "status");

-- CreateIndex
CREATE INDEX "inventory_items_supplierId_idx" ON "inventory_items"("supplierId");

-- CreateIndex
CREATE INDEX "products_shopId_status_idx" ON "products"("shopId", "status");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_brandId_idx" ON "products"("brandId");

-- CreateIndex
CREATE INDEX "products_shopId_name_idx" ON "products"("shopId", "name");

-- CreateIndex
CREATE INDEX "purchases_shopId_status_idx" ON "purchases"("shopId", "status");

-- CreateIndex
CREATE INDEX "purchases_supplierId_idx" ON "purchases"("supplierId");

-- CreateIndex
CREATE INDEX "purchases_shopId_purchaseDate_idx" ON "purchases"("shopId", "purchaseDate");

-- CreateIndex
CREATE INDEX "sales_shopId_createdAt_idx" ON "sales"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "sales_shopId_status_idx" ON "sales"("shopId", "status");

-- CreateIndex
CREATE INDEX "sales_customerId_idx" ON "sales"("customerId");

-- CreateIndex
CREATE INDEX "sales_saleDate_idx" ON "sales"("saleDate");

-- CreateIndex
CREATE INDEX "suppliers_shopId_status_idx" ON "suppliers"("shopId", "status");

-- CreateIndex
CREATE INDEX "suppliers_shopId_name_idx" ON "suppliers"("shopId", "name");
