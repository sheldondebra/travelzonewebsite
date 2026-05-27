import { normalizeEmail } from "@/lib/auth/email";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { PLATFORM_OFFICE_SLUG } from "@/lib/platform/office";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type {
  CreatePlatformUserInput,
  ListPlatformUsersInput,
  UpdatePlatformUserInput,
} from "@/server/validations/platform-user";
import { NotFoundError } from "@/server/utils/errors";
import { logActivity } from "@/server/utils/activity";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  businessId: true,
  emailVerified: true,
  emailVerifiedAt: true,
  suspended: true,
  suspendedAt: true,
  suspendedReason: true,
  passwordChangedAt: true,
  createdAt: true,
  updatedAt: true,
  business: { select: { id: true, name: true, slug: true } },
  _count: {
    select: {
      activities: true,
      ordersAsCashier: true,
    },
  },
} satisfies Prisma.UserSelect;

export type PlatformUserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>;

async function getOfficeBusinessId() {
  const office = await prisma.business.findUnique({
    where: { slug: PLATFORM_OFFICE_SLUG },
    select: { id: true },
  });
  return office?.id ?? null;
}

async function logPlatformUserAction(
  targetUser: PlatformUserRow,
  adminUserId: string,
  action: string,
  details?: string,
) {
  const businessId = targetUser.businessId ?? (await getOfficeBusinessId());
  if (!businessId) return;
  await logActivity({
    businessId,
    userId: adminUserId,
    action,
    entity: "user",
    entityId: targetUser.id,
    details,
  });
}

function buildWhere(input: ListPlatformUsersInput): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (input.search?.trim()) {
    const q = input.search.trim();
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }
  if (input.role) where.role = input.role;
  if (input.businessId) where.businessId = input.businessId;
  if (input.suspended === "true") where.suspended = true;
  if (input.suspended === "false") where.suspended = false;
  if (input.emailVerified === "true") where.emailVerified = true;
  if (input.emailVerified === "false") where.emailVerified = false;

  return where;
}

export async function listPlatformUsers(input: ListPlatformUsersInput) {
  const where = buildWhere(input);
  const skip = (input.page - 1) * input.limit;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: input.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items,
    total,
    page: input.page,
    limit: input.limit,
    totalPages: Math.ceil(total / input.limit) || 1,
  };
}

export async function getPlatformUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function createPlatformUser(
  input: CreatePlatformUserInput,
  adminUserId: string,
) {
  const strength = validatePasswordStrength(input.password);
  if (strength) throw new Error(strength);

  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with this email already exists");

  if (input.businessId) {
    const biz = await prisma.business.findUnique({
      where: { id: input.businessId },
    });
    if (!biz) throw new Error("Business not found");
  }

  const now = new Date();
  const user = await prisma.user.create({
    data: {
      email,
      password: await hashPassword(input.password),
      name: input.name ?? null,
      role: input.role,
      businessId: input.businessId ?? null,
      emailVerified: input.emailVerified ?? false,
      emailVerifiedAt: input.emailVerified ? now : null,
    },
    select: userSelect,
  });

  await logPlatformUserAction(user, adminUserId, "created", `Created user ${email}`);
  return user;
}

export async function updatePlatformUser(
  userId: string,
  input: UpdatePlatformUserInput,
  adminUserId: string,
) {
  const existing = await getPlatformUser(userId);

  if (input.email) {
    const email = normalizeEmail(input.email);
    const dup = await prisma.user.findFirst({
      where: { email, id: { not: userId } },
    });
    if (dup) throw new Error("Email already in use");
  }

  if (input.businessId) {
    const biz = await prisma.business.findUnique({
      where: { id: input.businessId },
    });
    if (!biz) throw new Error("Business not found");
  }

  let emailVerifiedAt = existing.emailVerifiedAt;
  if (input.emailVerified === true && !existing.emailVerified) {
    emailVerifiedAt = new Date();
  }
  if (input.emailVerified === false) {
    emailVerifiedAt = null;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.email ? { email: normalizeEmail(input.email) } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(input.businessId !== undefined ? { businessId: input.businessId } : {}),
      ...(input.emailVerified !== undefined
        ? { emailVerified: input.emailVerified, emailVerifiedAt }
        : {}),
    },
    select: userSelect,
  });

  await logPlatformUserAction(user, adminUserId, "updated", "Profile updated by admin");
  return user;
}

export async function deletePlatformUser(userId: string, adminUserId: string) {
  const user = await getPlatformUser(userId);
  if (user.role === "PLATFORM_ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "PLATFORM_ADMIN" },
    });
    if (adminCount <= 1) {
      throw new Error("Cannot delete the only platform administrator");
    }
  }

  await prisma.user.delete({ where: { id: userId } });
  await logPlatformUserAction(user, adminUserId, "deleted", `Deleted user ${user.email}`);
  return { deleted: true };
}

export async function verifyPlatformUserEmail(userId: string, adminUserId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true, emailVerifiedAt: new Date() },
    select: userSelect,
  });
  await logPlatformUserAction(user, adminUserId, "email_verified", "Email verified by admin");
  return user;
}

export async function resetPlatformUserPassword(
  userId: string,
  password: string,
  adminUserId: string,
) {
  const strength = validatePasswordStrength(password);
  if (strength) throw new Error(strength);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      password: await hashPassword(password),
      passwordChangedAt: new Date(),
    },
    select: userSelect,
  });

  await logPlatformUserAction(user, adminUserId, "password_reset", "Password reset by admin");
  return user;
}

export async function setPlatformUserSuspended(
  userId: string,
  suspended: boolean,
  reason: string | undefined,
  adminUserId: string,
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      suspended,
      suspendedAt: suspended ? new Date() : null,
      suspendedReason: suspended ? reason ?? "Suspended by administrator" : null,
    },
    select: userSelect,
  });

  await logPlatformUserAction(
    user,
    adminUserId,
    suspended ? "suspended" : "unsuspended",
    reason,
  );
  return user;
}

export async function getPlatformUserActivity(userId: string, limit = 50) {
  await getPlatformUser(userId);

  return prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      business: { select: { name: true, slug: true } },
    },
  });
}

export async function getPlatformUserStats() {
  const [total, verified, suspended, byRole] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.user.count({ where: { suspended: true } }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
  ]);

  return {
    total,
    verified,
    suspended,
    unverified: total - verified,
    byRole: byRole.map((r) => ({ role: r.role, count: r._count.id })),
  };
}
