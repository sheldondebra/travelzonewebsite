import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/auth/email";
import { verifyPassword } from "@/lib/auth/password";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  businessId: string | null;
  passwordChangedAt: Date;
};

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const normalized = normalizeEmail(email);

  const user = await prisma.user.findFirst({
    where: {
      email: { equals: normalized, mode: "insensitive" },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      businessId: true,
      password: true,
      passwordChangedAt: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    businessId: user.businessId,
    passwordChangedAt: user.passwordChangedAt,
  };
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const normalized = normalizeEmail(email);

  const user = await prisma.user.findFirst({
    where: {
      email: { equals: normalized, mode: "insensitive" },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      businessId: true,
      password: true,
      suspended: true,
    },
  });

  if (!user) return null;

  if (user.suspended) return null;

  const valid = await verifyPassword(password, user.password);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    businessId: user.businessId,
    passwordChangedAt: new Date(),
  };
}

export async function getUserForSession(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      businessId: true,
      passwordChangedAt: true,
    },
  });
}
