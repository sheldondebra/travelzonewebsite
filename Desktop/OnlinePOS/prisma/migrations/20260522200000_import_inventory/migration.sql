-- CreateEnum
CREATE TYPE "StockHistoryAction" AS ENUM ('IMPORT', 'MANUAL_ADJUSTMENT', 'SALE', 'PURCHASE', 'TRANSFER', 'DAMAGE', 'RETURN');
CREATE TYPE "MigrationLogStatus" AS ENUM ('SUCCESS', 'FAILED', 'SKIPPED', 'WARNING');
CREATE TYPE "ImportSessionStatus" AS ENUM ('UPLOADED', 'ANALYZED', 'RUNNING', 'COMPLETED', 'FAILED');

-- AlterTable ProductCategory
ALTER TABLE "ProductCategory" ADD COLUMN "oldId" BIGINT;
CREATE UNIQUE INDEX "ProductCategory_businessId_oldId_key" ON "ProductCategory"("businessId", "oldId");

-- AlterTable ProductSubCategory
ALTER TABLE "ProductSubCategory" ADD COLUMN "oldId" BIGINT;
CREATE UNIQUE INDEX "ProductSubCategory_businessId_oldId_key" ON "ProductSubCategory"("businessId", "oldId");

-- AlterTable ProductBrand
ALTER TABLE "ProductBrand" ADD COLUMN "oldId" BIGINT;
ALTER TABLE "ProductBrand" ADD COLUMN "imageUrl" TEXT;
CREATE UNIQUE INDEX "ProductBrand_businessId_oldId_key" ON "ProductBrand"("businessId", "oldId");

-- AlterTable ProductUnit
ALTER TABLE "ProductUnit" ADD COLUMN "oldId" BIGINT;
CREATE UNIQUE INDEX "ProductUnit_businessId_oldId_key" ON "ProductUnit"("businessId", "oldId");

-- Drop global unique on Product/Variant oldId if exists
DROP INDEX IF EXISTS "Product_oldId_key";
DROP INDEX IF EXISTS "ProductVariant_oldId_key";
CREATE UNIQUE INDEX "Product_businessId_oldId_key" ON "Product"("businessId", "oldId");
CREATE UNIQUE INDEX "ProductVariant_productId_oldId_key" ON "ProductVariant"("productId", "oldId");

-- CreateTable Warehouse
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "oldId" BIGINT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "city" TEXT,
    "email" TEXT,
    "zip" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable ImportSession
CREATE TABLE "ImportSession" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sqlContent" TEXT NOT NULL,
    "status" "ImportSessionStatus" NOT NULL DEFAULT 'UPLOADED',
    "tableSummary" JSONB,
    "options" JSONB,
    "progress" JSONB,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable MigrationLog
CREATE TABLE "MigrationLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "importSessionId" TEXT,
    "tableName" TEXT NOT NULL,
    "oldId" BIGINT,
    "newId" TEXT,
    "status" "MigrationLogStatus" NOT NULL,
    "message" TEXT,
    "sourceData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable StockHistory
CREATE TABLE "StockHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "warehouseId" TEXT,
    "oldQuantity" DOUBLE PRECISION,
    "newQuantity" DOUBLE PRECISION NOT NULL,
    "quantityChanged" DOUBLE PRECISION NOT NULL,
    "action" "StockHistoryAction" NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "changedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_businessId_oldId_key" ON "Warehouse"("businessId", "oldId");
CREATE UNIQUE INDEX "Warehouse_businessId_name_key" ON "Warehouse"("businessId", "name");
CREATE INDEX "Warehouse_businessId_idx" ON "Warehouse"("businessId");

CREATE INDEX "ImportSession_businessId_idx" ON "ImportSession"("businessId");
CREATE INDEX "ImportSession_status_idx" ON "ImportSession"("status");

CREATE INDEX "MigrationLog_businessId_idx" ON "MigrationLog"("businessId");
CREATE INDEX "MigrationLog_importSessionId_idx" ON "MigrationLog"("importSessionId");
CREATE INDEX "MigrationLog_tableName_idx" ON "MigrationLog"("tableName");
CREATE INDEX "MigrationLog_status_idx" ON "MigrationLog"("status");

CREATE INDEX "StockHistory_productId_idx" ON "StockHistory"("productId");
CREATE INDEX "StockHistory_variantId_idx" ON "StockHistory"("variantId");
CREATE INDEX "StockHistory_createdAt_idx" ON "StockHistory"("createdAt");

CREATE INDEX "ProductStock_warehouseId_idx" ON "ProductStock"("warehouseId");

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ImportSession" ADD CONSTRAINT "ImportSession_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MigrationLog" ADD CONSTRAINT "MigrationLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MigrationLog" ADD CONSTRAINT "MigrationLog_importSessionId_fkey" FOREIGN KEY ("importSessionId") REFERENCES "ImportSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductStock" ADD CONSTRAINT "ProductStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockHistory" ADD CONSTRAINT "StockHistory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
