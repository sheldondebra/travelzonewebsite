import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/auth/email";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { generateResetToken, hashResetToken } from "@/lib/auth/token";
import { sendPasswordResetEmail } from "@/server/services/auth/send-auth-email";
import { AppError } from "@/server/utils/errors";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function requestPasswordReset(email: string) {
  const normalized = normalizeEmail(email);
  const user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { id: true, email: true },
  });

  // Always behave the same (no email enumeration)
  if (!user) {
    return { message: "If that email exists, we sent reset instructions." };
  }

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const { token, tokenHash } = generateResetToken();
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await sendPasswordResetEmail(user.email, resetUrl);

  return { message: "If that email exists, we sent reset instructions." };
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
) {
  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) {
    throw new AppError(strengthError, 400);
  }

  const tokenHash = hashResetToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError("Invalid or expired reset link", 400);
  }

  const hashed = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        password: hashed,
        passwordChangedAt: new Date(),
        email: normalizeEmail(record.user.email),
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        userId: record.userId,
        usedAt: null,
        id: { not: record.id },
      },
      data: { usedAt: new Date() },
    }),
  ]);

  return { message: "Password updated. You can sign in now." };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) {
    throw new AppError(strengthError, 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  const { verifyPassword } = await import("@/lib/auth/password");
  const valid = await verifyPassword(currentPassword, user.password);
  if (!valid) {
    throw new AppError("Current password is incorrect", 400);
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashed,
      passwordChangedAt: new Date(),
    },
  });

  return { message: "Password changed successfully" };
}
