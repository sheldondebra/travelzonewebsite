import { prisma } from "@/lib/prisma";
import type { PriceType, Prisma } from "@/generated/prisma/client";

type PriceField = {
  type: PriceType;
  oldValue: number;
  newValue: number;
};

export async function recordPriceChanges(
  params: {
    productId: string;
    variantId?: string | null;
    changedBy?: string | null;
    reason?: string | null;
    changes: PriceField[];
  },
  tx?: Prisma.TransactionClient,
) {
  const rows = params.changes.filter((c) => c.oldValue !== c.newValue);
  if (rows.length === 0) return;

  const db = tx ?? prisma;
  await db.productPriceHistory.createMany({
    data: rows.map((c) => ({
      productId: params.productId,
      variantId: params.variantId ?? null,
      priceType: c.type,
      oldPrice: c.oldValue,
      newPrice: c.newValue,
      changedBy: params.changedBy ?? null,
      reason: params.reason ?? null,
    })),
  });
}
