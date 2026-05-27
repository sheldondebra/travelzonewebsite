import { PLATFORM_OFFICE_SLUG } from "@/lib/platform/office";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";

export async function GET() {
  try {
    await requirePlatformAdmin();

    const businesses = await prisma.business.findMany({
      where: { slug: { not: PLATFORM_OFFICE_SLUG } },
      select: {
        id: true,
        name: true,
        slug: true,
        smsWallet: { select: { balance: true, updatedAt: true } },
      },
      orderBy: { name: "asc" },
    });

    const rows = businesses.map((b) => ({
      businessId: b.id,
      name: b.name,
      slug: b.slug,
      balance: b.smsWallet?.balance ?? 0,
      updatedAt: b.smsWallet?.updatedAt ?? null,
    }));

    return apiSuccess(rows);
  } catch (e) {
    return handleApiError(e);
  }
}
