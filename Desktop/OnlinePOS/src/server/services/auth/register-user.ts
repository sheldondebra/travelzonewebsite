import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/auth/email";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { AppError } from "@/server/utils/errors";
import type { RegisterInput } from "@/server/validations/auth";

export async function registerUser(input: RegisterInput) {
  const email = normalizeEmail(input.email);
  const strengthError = validatePasswordStrength(input.password);
  if (strengthError) {
    throw new AppError(strengthError, 400);
  }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const hashed = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      email,
      password: hashed,
      name: input.name?.trim() || null,
      role: "OWNER",
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      businessId: true,
    },
  });
}
