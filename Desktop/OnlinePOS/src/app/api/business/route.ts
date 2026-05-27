import { getServerSession } from "next-auth";
import { updateBusiness } from "@/server/services/business/update-business";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { parseJsonBody } from "@/server/utils/with-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { createBusinessSchema, updateBusinessSchema } from "@/server/validations/business";
import { uniqueSlug } from "@/lib/slug";
import { UnauthorizedError } from "@/server/utils/errors";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) throw new UnauthorizedError();

    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId },
    });
    return apiSuccess(business, "Business fetched");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new UnauthorizedError();
    if (session.user.businessId) {
      return handleApiError(new Error("Business already configured"));
    }

    const body = await parseJsonBody(request);
    const input = createBusinessSchema.parse(body);
    const slug = await uniqueSlug(input.name, async (s) => {
      const found = await prisma.business.findUnique({ where: { slug: s } });
      return !!found;
    });
    const business = await prisma.business.create({
      data: { name: input.name, slug },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { businessId: business.id, role: "OWNER" },
    });

    return apiSuccess(business, "Business created", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) throw new UnauthorizedError();

    const body = await parseJsonBody(request);
    const input = updateBusinessSchema.parse(body);
    const business = await updateBusiness(session.user.businessId, input);
    return apiSuccess(business, "Settings saved");
  } catch (error) {
    return handleApiError(error);
  }
}
