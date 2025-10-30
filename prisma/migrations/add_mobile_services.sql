-- Create enum for service types
CREATE TYPE "ServiceType" AS ENUM (
  'EASYPAISA_CASHIN',
  'EASYPAISA_CASHOUT',
  'JAZZCASH_CASHIN',
  'JAZZCASH_CASHOUT',
  'BANK_TRANSFER',
  'MOBILE_LOAD',
  'BILL_PAYMENT'
);

-- Create enum for load providers
CREATE TYPE "LoadProvider" AS ENUM ('JAZZ', 'TELENOR', 'ZONG', 'UFONE');

-- Create enum for transaction status
CREATE TYPE "TransactionStatus" AS ENUM ('COMPLETED', 'PENDING', 'FAILED', 'CANCELLED');

-- Create mobile_services table
CREATE TABLE "mobile_services" (
  "id" TEXT NOT NULL PRIMARY KEY,
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

  CONSTRAINT "mobile_services_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE,
  CONSTRAINT "mobile_services_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id")
);

-- Create indexes
CREATE INDEX "mobile_services_shopId_idx" ON "mobile_services"("shopId");
CREATE INDEX "mobile_services_transactionDate_idx" ON "mobile_services"("transactionDate");
CREATE INDEX "mobile_services_serviceType_idx" ON "mobile_services"("serviceType");
CREATE INDEX "mobile_services_status_idx" ON "mobile_services"("status");
CREATE INDEX "mobile_services_phoneNumber_idx" ON "mobile_services"("phoneNumber");
