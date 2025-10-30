/*
  Warnings:

  - A unique constraint covering the columns `[code,shopId]` on the table `brands` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,shopId]` on the table `brands` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,shopId]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone,shopId]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cnic,shopId]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku,shopId]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[barcode,shopId]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subdomain]` on the table `shops` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shopId` to the `brands` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `inventory_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `databaseName` to the `shops` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `suppliers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "brands_code_key";

-- DropIndex
DROP INDEX "brands_name_key";

-- DropIndex
DROP INDEX "categories_code_key";

-- DropIndex
DROP INDEX "products_barcode_key";

-- DropIndex
DROP INDEX "products_sku_key";

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "businessInfo" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "databaseName" TEXT NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "isInitialized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'basic',
ADD COLUMN     "subdomain" TEXT;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "shopId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_userId_productId_shopId_key" ON "cart_items"("userId", "productId", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_code_shopId_key" ON "brands"("code", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_shopId_key" ON "brands"("name", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_shopId_key" ON "categories"("code", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_shopId_key" ON "customers"("phone", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_cnic_shopId_key" ON "customers"("cnic", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_shopId_key" ON "products"("sku", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_shopId_key" ON "products"("barcode", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "shops_subdomain_key" ON "shops"("subdomain");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
