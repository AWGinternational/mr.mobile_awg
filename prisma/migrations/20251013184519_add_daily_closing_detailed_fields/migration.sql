-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET_PERFORMED';
ALTER TYPE "AuditAction" ADD VALUE 'USER_STATUS_CHANGED';

-- DropForeignKey
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_shopId_fkey";

-- DropIndex
DROP INDEX "daily_closings_date_key";

-- DropIndex
DROP INDEX "sales_predictions_productId_predictionDate_key";

-- AlterTable
ALTER TABLE "approval_requests" ALTER COLUMN "shopId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "daily_closings" ADD COLUMN     "bankTransfer" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "bankTransferSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cardSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cash" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cashSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "credit" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "easypaisaSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "inventory" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "jazzLoadSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "jazzcashSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "loan" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "netAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "receiving" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "telenorLoadSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalIncome" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "ufoneLoadSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "zongLoadSales" DECIMAL(12,2) NOT NULL DEFAULT 0,
ALTER COLUMN "shopId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "purchases" ALTER COLUMN "shopId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sales_predictions" ALTER COLUMN "shopId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "stock_recommendations" ALTER COLUMN "shopId" DROP DEFAULT;
