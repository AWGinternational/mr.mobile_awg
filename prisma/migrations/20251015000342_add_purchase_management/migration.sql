/*
  Warnings:

  - The `status` column on the `purchases` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'ORDERED', 'PARTIAL', 'RECEIVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('EASYPAISA_CASHIN', 'EASYPAISA_CASHOUT', 'JAZZCASH_CASHIN', 'JAZZCASH_CASHOUT', 'BANK_TRANSFER', 'MOBILE_LOAD', 'BILL_PAYMENT');

-- CreateEnum
CREATE TYPE "LoadProvider" AS ENUM ('JAZZ', 'TELENOR', 'ZONG', 'UFONE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('COMPLETED', 'PENDING', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "daily_closings" ALTER COLUMN "totalSales" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "totalCash" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "totalCard" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "totalDigital" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "openingCash" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "closingCash" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "cashDeposited" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "totalExpenses" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "expectedCash" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "actualCash" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "variance" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "bankTransfer" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "bankTransferSales" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "cardSales" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "cash" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "cashSales" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "credit" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "easypaisaSales" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "inventory" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "jazzLoadSales" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "jazzcashSales" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "loan" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "netAmount" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "receiving" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "telenorLoadSales" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "totalIncome" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "ufoneLoadSales" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "zongLoadSales" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "purchase_items" ADD COLUMN     "imeiNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "receivedQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "serialNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "receivedDate" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "PurchaseStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "purchase_payments" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_services" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceType" "ServiceType" NOT NULL,
    "loadProvider" "LoadProvider",
    "customerName" TEXT,
    "phoneNumber" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "commission" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netCommission" DECIMAL(10,2) NOT NULL,
    "referenceId" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mobile_services_shopId_idx" ON "mobile_services"("shopId");

-- CreateIndex
CREATE INDEX "mobile_services_transactionDate_idx" ON "mobile_services"("transactionDate");

-- CreateIndex
CREATE INDEX "mobile_services_serviceType_idx" ON "mobile_services"("serviceType");

-- CreateIndex
CREATE INDEX "mobile_services_status_idx" ON "mobile_services"("status");

-- CreateIndex
CREATE INDEX "mobile_services_phoneNumber_idx" ON "mobile_services"("phoneNumber");

-- AddForeignKey
ALTER TABLE "purchase_payments" ADD CONSTRAINT "purchase_payments_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_services" ADD CONSTRAINT "mobile_services_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_services" ADD CONSTRAINT "mobile_services_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
