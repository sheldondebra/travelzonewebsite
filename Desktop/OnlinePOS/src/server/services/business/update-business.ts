import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { UpdateBusinessInput } from "@/server/validations/business";

export async function updateBusiness(
  businessId: string,
  input: UpdateBusinessInput,
) {
  const { dashboardLayout, logoUrl, bannerUrl, ...rest } = input;

  return prisma.business.update({
    where: { id: businessId },
    data: {
      ...rest,
      logoUrl: logoUrl === "" ? null : logoUrl,
      bannerUrl: bannerUrl === "" ? null : bannerUrl,
      ...(dashboardLayout !== undefined
        ? { dashboardLayout: dashboardLayout as Prisma.InputJsonValue }
        : {}),
    },
  });
}
