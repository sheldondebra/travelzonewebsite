import { prisma } from "@/lib/prisma";

/**
 * Wipes imported POS data for one tenant. Keeps Business row and app User accounts.
 * Does not touch Tecunit General Office or other businesses.
 */
export async function resetTenantImportData(businessId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { order: { businessId } } });
    await tx.orderStatusHistory.deleteMany({ where: { order: { businessId } } });
    await tx.saleReturnLine.deleteMany({ where: { saleReturn: { businessId } } });
    await tx.saleReturn.deleteMany({ where: { businessId } });
    await tx.order.deleteMany({ where: { businessId } });

    await tx.stockHistory.deleteMany({
      where: {
        OR: [
          { product: { businessId } },
          { variant: { product: { businessId } } },
        ],
      },
    });
    await tx.productPriceHistory.deleteMany({
      where: {
        OR: [
          { product: { businessId } },
          { variant: { product: { businessId } } },
        ],
      },
    });
    await tx.productStock.deleteMany({
      where: {
        OR: [
          { product: { businessId } },
          { variant: { product: { businessId } } },
        ],
      },
    });
    await tx.productVariant.deleteMany({ where: { product: { businessId } } });
    await tx.product.deleteMany({ where: { businessId } });
    // Safety: remove any rows without legacy id (bad CSV/SQL line imports)
    await tx.product.deleteMany({
      where: { businessId, oldId: null },
    });

    await tx.productSubCategory.deleteMany({ where: { businessId } });
    await tx.productCategory.deleteMany({ where: { businessId } });
    await tx.productBrand.deleteMany({ where: { businessId } });
    await tx.productUnit.deleteMany({ where: { businessId } });
    await tx.warehouse.deleteMany({ where: { businessId } });

    await tx.customer.deleteMany({ where: { businessId } });
    await tx.legacyUser.deleteMany({ where: { businessId } });
    await tx.cashRegister.deleteMany({ where: { businessId } });

    await tx.migrationLog.deleteMany({ where: { businessId } });
    await tx.importSession.deleteMany({ where: { businessId } });

    await tx.inventoryMovement.deleteMany({ where: { businessId } });
    await tx.expense.deleteMany({ where: { businessId } });
    await tx.notification.deleteMany({ where: { businessId } });
  });
}
