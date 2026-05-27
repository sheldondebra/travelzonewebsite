-- AlterTable
ALTER TABLE "Product" ADD COLUMN "legacyMeta" JSONB;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN "legacyMeta" JSONB;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "lineTotal" DOUBLE PRECISION,
ADD COLUMN "unitCost" DOUBLE PRECISION;
