import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";

export async function GET() {
  try {
    await requirePlatformAdmin();

    const tenants = await prisma.business.findMany({
      where: { slug: { not: "tecunit-general-office" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });

    const office = await prisma.business.findUnique({
      where: { slug: "tecunit-general-office" },
      select: { id: true, name: true, slug: true },
    });

    return apiSuccess(
      office ? [office, ...tenants] : tenants,
      "Tenants listed",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
