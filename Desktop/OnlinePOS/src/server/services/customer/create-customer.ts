import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/auth/email";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { AppError } from "@/server/utils/errors";
import type { CreateCustomerInput } from "@/server/validations/customer";

export async function createCustomer(
  businessId: string,
  input: CreateCustomerInput,
) {
  const email = input.email?.trim() ? normalizeEmail(input.email) : null;

  if (input.enableLogin) {
    if (!email) {
      throw new AppError("Email is required for customers with login", 400);
    }
    if (!input.portalPassword) {
      throw new AppError("Password is required for customers with login", 400);
    }
    const strengthError = validatePasswordStrength(input.portalPassword);
    if (strengthError) throw new AppError(strengthError, 400);

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (existing) {
      throw new AppError("An account with this email already exists", 409);
    }

    const hashed = await hashPassword(input.portalPassword);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashed,
          name: input.name.trim(),
          role: "CUSTOMER",
          businessId,
        },
      });
      return tx.customer.create({
        data: {
          name: input.name,
          phone: input.phone,
          email,
          notes: input.notes,
          tags: input.tags ?? [],
          businessId,
          userId: user.id,
        },
        include: {
          user: { select: { id: true, email: true } },
          _count: { select: { orders: true } },
        },
      });
    });
  }

  return prisma.customer.create({
    data: {
      name: input.name,
      phone: input.phone,
      email,
      notes: input.notes,
      tags: input.tags ?? [],
      businessId,
    },
    include: {
      user: { select: { id: true, email: true } },
      _count: { select: { orders: true } },
    },
  });
}
