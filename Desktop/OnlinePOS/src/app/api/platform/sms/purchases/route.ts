import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const purchases = await prisma.smsPurchase.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        business: { select: { name: true, slug: true } },
        package: { select: { name: true } },
      },
    });
    return apiSuccess(purchases);
  } catch (e) {
    return handleApiError(e);
  }
}
