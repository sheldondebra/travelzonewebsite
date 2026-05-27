import { getServerSession } from "next-auth";
import { z } from "zod";
import { BillingInterval, BillingProvider } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth-options";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { UnauthorizedError } from "@/server/utils/errors";
import { parseJsonBody } from "@/server/utils/with-auth";
import { createBillingCheckout } from "@/server/services/billing/billing-service";

const checkoutSchema = z.object({
  planId: z.string().min(1),
  interval: z.enum(BillingInterval),
  currency: z.string().min(3).max(3),
  couponCode: z.string().optional(),
  country: z.string().optional(),
  provider: z.enum(BillingProvider).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId || !session.user.email) {
      throw new UnauthorizedError();
    }
    const input = checkoutSchema.parse(await parseJsonBody(request));
    const checkout = await createBillingCheckout({
      ...input,
      businessId: session.user.businessId,
      email: session.user.email,
      customerName: session.user.name,
    });
    return apiSuccess(checkout, "Checkout created", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
