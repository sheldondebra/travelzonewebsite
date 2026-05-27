-- Legacy import parity: map old clients/sales IDs into new Postgres schema
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "oldId" BIGINT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "legacyCode" TEXT;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "oldId" BIGINT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "reference" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "legacyMeta" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_businessId_oldId_key" ON "Customer"("businessId", "oldId");
CREATE UNIQUE INDEX IF NOT EXISTS "Order_businessId_oldId_key" ON "Order"("businessId", "oldId");
CREATE INDEX IF NOT EXISTS "Order_reference_idx" ON "Order"("reference");
