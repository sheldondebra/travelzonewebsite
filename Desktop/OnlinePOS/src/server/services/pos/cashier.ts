import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signCashierToken, verifyCashierToken } from "@/lib/pos/cashier-token";
import { mergeSettings } from "@/lib/settings/defaults";
import { AppError, UnauthorizedError } from "@/server/utils/errors";
import { logActivity } from "@/server/utils/activity";

const POS_STAFF_ROLES = ["OWNER", "MANAGER", "STAFF"] as const;

export async function listPosStaff(businessId: string) {
  return prisma.user.findMany({
    where: {
      businessId,
      role: { in: [...POS_STAFF_ROLES] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      posPinHash: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function verifyCashierPin(businessId: string, pin: string) {
  const trimmed = pin.trim();
  if (!/^\d{4,6}$/.test(trimmed)) {
    throw new AppError("PIN must be 4–6 digits", 400);
  }

  const staff = await prisma.user.findMany({
    where: {
      businessId,
      role: { in: [...POS_STAFF_ROLES] },
      posPinHash: { not: null },
    },
    select: {
      id: true,
      name: true,
      role: true,
      posPinHash: true,
    },
  });

  for (const user of staff) {
    if (!user.posPinHash) continue;
    const match = await verifyPassword(trimmed, user.posPinHash);
    if (match) {
      const token = await signCashierToken({
        cashierId: user.id,
        businessId,
        name: user.name,
        role: user.role,
      });
      return {
        cashier: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
        token,
      };
    }
  }

  throw new UnauthorizedError("Invalid cashier PIN");
}

export async function setUserPosPin(
  businessId: string,
  actorUserId: string,
  targetUserId: string,
  pin: string | null,
) {
  const trimmed = pin?.trim() ?? "";
  if (pin !== null && !/^\d{4,6}$/.test(trimmed)) {
    throw new AppError("PIN must be 4–6 digits", 400);
  }

  const [actor, target] = await Promise.all([
    prisma.user.findFirst({ where: { id: actorUserId, businessId } }),
    prisma.user.findFirst({ where: { id: targetUserId, businessId } }),
  ]);

  if (!actor || !target) throw new AppError("User not found", 404);

  const canSetOthers =
    actor.role === "OWNER" ||
    actor.role === "MANAGER" ||
    actor.role === "PLATFORM_ADMIN";
  if (targetUserId !== actorUserId && !canSetOthers) {
    throw new UnauthorizedError("Only managers can set PINs for other staff");
  }

  const posPinHash =
    pin === null || trimmed === "" ? null : await hashPassword(trimmed);

  await prisma.user.update({
    where: { id: targetUserId },
    data: { posPinHash },
  });

  await logActivity({
    businessId,
    userId: actorUserId,
    action: pin ? "set_pin" : "cleared_pin",
    entity: "user",
    entityId: targetUserId,
    details: target.name ?? target.email,
  });

  return { userId: targetUserId, hasPin: !!posPinHash };
}

export async function resolvePosCashierId(
  request: Request,
  businessId: string,
  sessionUserId: string,
  cashierToken?: string | null,
) {
  const token =
    cashierToken?.trim() ||
    request.headers.get("x-pos-cashier-token")?.trim() ||
    null;

  if (token) {
    const payload = await verifyCashierToken(token);
    if (payload.businessId !== businessId) {
      throw new UnauthorizedError("Invalid cashier session");
    }
    const user = await prisma.user.findFirst({
      where: { id: payload.cashierId, businessId },
      select: { id: true },
    });
    if (!user) throw new UnauthorizedError("Cashier not found");
    return user.id;
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      settings: true,
      currency: true,
      receiptFooter: true,
      themeColor: true,
    },
  });
  const settings = mergeSettings(business?.settings, {
    currency: business?.currency,
    receiptFooter: business?.receiptFooter,
    themeColor: business?.themeColor,
  });

  if (settings.pos.requireCashierPin) {
    throw new AppError("Cashier PIN required", 401);
  }

  return sessionUserId;
}
