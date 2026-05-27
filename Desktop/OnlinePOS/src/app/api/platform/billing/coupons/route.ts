import { z } from "zod";
import { BillingInterval } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";
import { parseJsonBody } from "@/server/utils/with-auth";

const couponSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2),
  description: z.string().optional(),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.number().positive(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true),
  applicablePlanId: z.string().nullable().optional(),
  applicableCurrency: z.string().nullable().optional(),
  applicableInterval: z.enum(BillingInterval).nullable().optional(),
});

export async function GET() {
  try {
    await requirePlatformAdmin();
    const coupons = await prisma.billingCoupon.findMany({
      include: { applicablePlan: true, redemptions: true },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(coupons, "Coupons loaded");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePlatformAdmin();
    const input = couponSchema.parse(await parseJsonBody(request));
    const coupon = await prisma.billingCoupon.create({
      data: {
        ...input,
        code: input.code.trim().toUpperCase(),
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
      },
    });
    return apiSuccess(coupon, "Coupon created", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requirePlatformAdmin();
    const input = couponSchema.partial().extend({ id: z.string() }).parse(await parseJsonBody(request));
    const { id, ...patch } = input;
    const coupon = await prisma.billingCoupon.update({
      where: { id },
      data: {
        ...patch,
        code: patch.code ? patch.code.trim().toUpperCase() : undefined,
        validFrom: patch.validFrom ? new Date(patch.validFrom) : patch.validFrom,
        validUntil: patch.validUntil ? new Date(patch.validUntil) : patch.validUntil,
      },
    });
    return apiSuccess(coupon, "Coupon saved");
  } catch (error) {
    return handleApiError(error);
  }
}
