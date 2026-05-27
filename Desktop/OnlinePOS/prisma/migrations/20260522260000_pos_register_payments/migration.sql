-- CreateEnum
CREATE TYPE "OrderSaleStatus" AS ENUM ('DRAFT', 'HELD', 'COMPLETED', 'VOIDED', 'REFUNDED');

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'SPLIT';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "changeDue" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "saleStatus" "OrderSaleStatus" NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cashierId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "registerSessionId" TEXT;

-- CreateTable
CREATE TABLE "RegisterSession" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "openingFloat" DOUBLE PRECISION NOT NULL,
    "expectedCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "countedCash" DOUBLE PRECISION,
    "difference" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openingNote" TEXT,
    "closingNote" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "RegisterSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "network" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PosHeldSale" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "cashierId" TEXT,
    "label" TEXT NOT NULL,
    "customerId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosHeldSale_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "registerSessionId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegisterSession_businessId_idx" ON "RegisterSession"("businessId");
CREATE INDEX "RegisterSession_cashierId_idx" ON "RegisterSession"("cashierId");
CREATE INDEX "RegisterSession_status_idx" ON "RegisterSession"("status");
CREATE INDEX "RegisterSession_openedAt_idx" ON "RegisterSession"("openedAt");

CREATE INDEX "OrderPayment_orderId_idx" ON "OrderPayment"("orderId");
CREATE INDEX "OrderPayment_method_idx" ON "OrderPayment"("method");

CREATE INDEX "PosHeldSale_businessId_idx" ON "PosHeldSale"("businessId");
CREATE INDEX "PosHeldSale_cashierId_idx" ON "PosHeldSale"("cashierId");
CREATE INDEX "PosHeldSale_createdAt_idx" ON "PosHeldSale"("createdAt");

CREATE INDEX "CashMovement_businessId_idx" ON "CashMovement"("businessId");
CREATE INDEX "CashMovement_registerSessionId_idx" ON "CashMovement"("registerSessionId");
CREATE INDEX "CashMovement_createdAt_idx" ON "CashMovement"("createdAt");

CREATE INDEX "Order_saleStatus_idx" ON "Order"("saleStatus");
CREATE INDEX "Order_cashierId_idx" ON "Order"("cashierId");
CREATE INDEX "Order_registerSessionId_idx" ON "Order"("registerSessionId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_registerSessionId_fkey" FOREIGN KEY ("registerSessionId") REFERENCES "RegisterSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RegisterSession" ADD CONSTRAINT "RegisterSession_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RegisterSession" ADD CONSTRAINT "RegisterSession_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderPayment" ADD CONSTRAINT "OrderPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PosHeldSale" ADD CONSTRAINT "PosHeldSale_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PosHeldSale" ADD CONSTRAINT "PosHeldSale_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_registerSessionId_fkey" FOREIGN KEY ("registerSessionId") REFERENCES "RegisterSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
