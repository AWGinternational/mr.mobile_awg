-- AlterTable: Add shopId to Purchase table for multi-tenancy
ALTER TABLE "purchases" ADD COLUMN "shopId" TEXT NOT NULL DEFAULT 'temp-shop-id';

-- AlterTable: Add shopId to DailyClosing table for multi-tenancy
ALTER TABLE "daily_closings" ADD COLUMN "shopId" TEXT NOT NULL DEFAULT 'temp-shop-id';

-- AlterTable: Modify unique constraint on daily_closings (remove old, add new with shopId)
ALTER TABLE "daily_closings" DROP CONSTRAINT IF EXISTS "daily_closings_date_key";

-- AlterTable: Add shopId to SalesPrediction table for multi-tenancy
ALTER TABLE "sales_predictions" ADD COLUMN "shopId" TEXT NOT NULL DEFAULT 'temp-shop-id';

-- AlterTable: Modify unique constraint on sales_predictions (remove old, add new with shopId)
ALTER TABLE "sales_predictions" DROP CONSTRAINT IF EXISTS "sales_predictions_productId_predictionDate_key";

-- AlterTable: Add shopId to StockRecommendation table for multi-tenancy
ALTER TABLE "stock_recommendations" ADD COLUMN "shopId" TEXT NOT NULL DEFAULT 'temp-shop-id';

-- AlterTable: Add shopId to ApprovalRequest table for multi-tenancy
ALTER TABLE "approval_requests" ADD COLUMN "shopId" TEXT NOT NULL DEFAULT 'temp-shop-id';

-- AddForeignKey: Purchase to Shop
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: DailyClosing to Shop
ALTER TABLE "daily_closings" ADD CONSTRAINT "daily_closings_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: SalesPrediction to Shop
ALTER TABLE "sales_predictions" ADD CONSTRAINT "sales_predictions_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: StockRecommendation to Shop
ALTER TABLE "stock_recommendations" ADD CONSTRAINT "stock_recommendations_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: ApprovalRequest to Shop
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex: Add unique constraint for daily_closings per shop per date
CREATE UNIQUE INDEX "daily_closings_shopId_date_key" ON "daily_closings"("shopId", "date");

-- CreateIndex: Add unique constraint for sales_predictions per shop
CREATE UNIQUE INDEX "sales_predictions_productId_predictionDate_shopId_key" ON "sales_predictions"("productId", "predictionDate", "shopId");

-- CreateIndex: Add index for approval_requests queries by shop
CREATE INDEX "approval_requests_shopId_status_idx" ON "approval_requests"("shopId", "status");

