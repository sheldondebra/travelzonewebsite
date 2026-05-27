import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { seedDefaultSmsPackages } from "@/server/services/sms/sms-service";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";
import { parseJsonBody } from "@/server/utils/with-auth";

export async function GET() {
  try {
    await requirePlatformAdmin();
    await seedDefaultSmsPackages();
    const packages = await prisma.smsPackage.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return apiSuccess(packages);
  } catch (e) {
    return handleApiError(e);
  }
}

const packageSchema = z.object({
  name: z.string().min(1),
  smsCount: z.number().int().positive(),
  price: z.number().positive(),
  currency: z.string().default("GHS"),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    await requirePlatformAdmin();
    const body = await parseJsonBody(request);
    const input = packageSchema.parse(body);
    const pkg = await prisma.smsPackage.create({ data: input });
    return apiSuccess(pkg, "Package created", 201);
  } catch (e) {
    return handleApiError(e);
  }
}

const updateSchema = packageSchema.partial().extend({
  id: z.string().min(1),
});

export async function PATCH(request: Request) {
  try {
    await requirePlatformAdmin();
    const body = await parseJsonBody(request);
    const { id, ...data } = updateSchema.parse(body);
    const pkg = await prisma.smsPackage.update({
      where: { id },
      data,
    });
    return apiSuccess(pkg, "Package updated");
  } catch (e) {
    return handleApiError(e);
  }
}
