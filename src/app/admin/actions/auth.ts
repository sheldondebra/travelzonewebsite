"use server";

import { redirect } from "next/navigation";
import {
  authenticateStaff,
  consumePasswordResetToken,
  createPasswordResetToken,
  createStaffSession,
  getStaffUser,
  updateStaffUserPassword,
} from "@/lib/auth/staff";
import { clearSessionCookieOnServer } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/config";
import { sendEmail } from "@/lib/email";
import { rateLimitFromHeaders } from "@/lib/rate-limit";

function getAppUrl() {
  return (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export type LoginActionState = { error?: string; success?: boolean };

export async function loginAction(
  _prev: LoginActionState | undefined,
  formData: FormData,
): Promise<LoginActionState> {
  if (!isDatabaseConfigured()) {
    return { error: "Admin is not configured yet." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const limit = await rateLimitFromHeaders("admin-login", 8, 15 * 60 * 1000, email);
  if (!limit.allowed) {
    return { error: "Too many login attempts. Please wait a few minutes and try again." };
  }

  const staff = await authenticateStaff(email, password);
  if (!staff) {
    return { error: "Invalid email or password." };
  }

  await createStaffSession(staff);
  redirect("/admin");
}

export type PasswordResetActionState = { error?: string; success?: string };

export async function requestPasswordResetAction(
  _prev: PasswordResetActionState | undefined,
  formData: FormData,
): Promise<PasswordResetActionState> {
  if (!isDatabaseConfigured()) {
    return { error: "Admin is not configured yet." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return { error: "Enter your email address." };
  }

  const limit = await rateLimitFromHeaders("admin-reset", 5, 60 * 60 * 1000, email);
  if (!limit.allowed) {
    return { error: "Too many reset requests. Please try again later." };
  }

  const reset = await createPasswordResetToken(email);
  if (reset) {
    const resetUrl = `${getAppUrl()}/admin/reset-password?token=${reset.token}`;
    try {
      await sendEmail({
        to: reset.email,
        subject: "Reset your Travel Zone admin password",
        text: `Use this link to reset your password (valid for 1 hour):\n\n${resetUrl}`,
        html: `<p>Use this link to reset your password (valid for 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    } catch {
      if (process.env.NODE_ENV !== "production") {
        console.info(`Password reset link for ${reset.email}: ${resetUrl}`);
      }
    }
  }

  return {
    success:
      "If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.",
  };
}

export type UpdatePasswordActionState = { error?: string; success?: boolean };

export async function updatePasswordAction(
  _prev: UpdatePasswordActionState | undefined,
  formData: FormData,
): Promise<UpdatePasswordActionState> {
  if (!isDatabaseConfigured()) {
    return { error: "Admin is not configured yet." };
  }

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const token = String(formData.get("token") ?? "").trim();

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (!token) {
    return {
      error: "Your reset link has expired. Request a new one from the login page.",
    };
  }

  const reset = await consumePasswordResetToken(token);
  if (!reset) {
    return {
      error: "Your reset link has expired. Request a new one from the login page.",
    };
  }

  await updateStaffUserPassword(reset.userId, password);
  await clearSessionCookieOnServer();
  return { success: true };
}

export async function logoutAction() {
  if (!isDatabaseConfigured()) {
    redirect("/admin/setup");
  }

  await clearSessionCookieOnServer();
  redirect("/admin/login");
}

export async function getAuthenticatedStaffForPage() {
  return getStaffUser();
}
