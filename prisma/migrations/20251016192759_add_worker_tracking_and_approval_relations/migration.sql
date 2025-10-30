-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterEnum
ALTER TYPE "ApprovalStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ApprovalType" ADD VALUE 'PRODUCT_CREATE';
ALTER TYPE "ApprovalType" ADD VALUE 'PRICE_UPDATE';
ALTER TYPE "ApprovalType" ADD VALUE 'STOCK_ADJUSTMENT';
ALTER TYPE "ApprovalType" ADD VALUE 'CUSTOMER_CREATE';
ALTER TYPE "ApprovalType" ADD VALUE 'CUSTOMER_DELETE';
ALTER TYPE "ApprovalType" ADD VALUE 'SUPPLIER_CREATE';
ALTER TYPE "ApprovalType" ADD VALUE 'SUPPLIER_UPDATE';
ALTER TYPE "ApprovalType" ADD VALUE 'REFUND_REQUEST';
ALTER TYPE "ApprovalType" ADD VALUE 'DISCOUNT_OVERRIDE';

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "sellerId" TEXT;

-- CreateIndex
CREATE INDEX "approval_requests_workerId_status_idx" ON "approval_requests"("workerId", "status");

-- CreateIndex
CREATE INDEX "sales_sellerId_idx" ON "sales"("sellerId");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
