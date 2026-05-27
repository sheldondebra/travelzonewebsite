import { signMobileToken } from "@/lib/jwt";
import { normalizeEmail } from "@/lib/auth/email";
import { verifyCredentials } from "@/server/services/auth/verify-credentials";
import { UnauthorizedError } from "@/server/utils/errors";
import type { mobileLoginSchema } from "@/server/validations/auth";
import type { z } from "zod";

type MobileLoginInput = z.infer<typeof mobileLoginSchema>;

export async function mobileLogin(input: MobileLoginInput) {
  const user = await verifyCredentials(input.email, input.password);

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = await signMobileToken({
    userId: user.id,
    businessId: user.businessId,
    email: normalizeEmail(user.email),
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businessId,
    },
  };
}
