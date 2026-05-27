import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/utils/errors";

/** Ensures migrations + `prisma generate` ran before legacy client/order import. */
export async function assertImportSchemaReady() {
  try {
    await prisma.customer.findFirst({
      where: { id: "__schema_probe__", oldId: BigInt(-1) },
      select: { id: true },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unknown argument `oldId`")) {
      throw new AppError(
        "Import schema is out of date. Run: npx prisma migrate deploy && npx prisma generate — then restart the dev server and import again.",
        503,
      );
    }
  }

  try {
    await prisma.order.findFirst({
      where: { id: "__schema_probe__", oldId: BigInt(-1) },
      select: { id: true },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unknown argument `oldId`")) {
      throw new AppError(
        "Import schema is out of date. Run: npx prisma migrate deploy && npx prisma generate — then restart the dev server and import again.",
        503,
      );
    }
  }
}
