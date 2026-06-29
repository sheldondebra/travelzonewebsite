"use server";

import { redirect } from "next/navigation";
import { rateLimitFromHeaders } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/supabase/auth";

function getAppUrl() {
  return (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  if (!isSupabaseConfigured()) {
    redirect("/admin/setup");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const limit = await rateLimitFromHeaders("admin-login", 8, 15 * 60 * 1000, email);
  if (!limit.allowed) {
    return { error: "Too many login attempts. Please wait a few minutes and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const staff = await getStaffUser();
  if (!staff) {
    await supabase.auth.signOut();
    return { error: "This account does not have dashboard access." };
  }

  redirect("/admin");
}

export async function requestPasswordResetAction(
  _prev: { error?: string; success?: string } | undefined,
  formData: FormData,
) {
  if (!isSupabaseConfigured()) {
    redirect("/admin/setup");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return { error: "Enter your email address." };
  }

  const limit = await rateLimitFromHeaders("admin-reset", 5, 60 * 60 * 1000, email);
  if (!limit.allowed) {
    return { error: "Too many reset requests. Please try again later." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAppUrl()}/admin/auth/callback?next=/admin/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success:
      "If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.",
  };
}

export async function updatePasswordAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  if (!isSupabaseConfigured()) {
    redirect("/admin/setup");
  }

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Your reset link has expired. Request a new one from the login page.",
    };
  }

  const staff = await getStaffUser();
  if (!staff) {
    await supabase.auth.signOut();
    return { error: "This account does not have dashboard access." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  await supabase.auth.signOut();
  redirect("/admin/login?reset=success");
}

export async function logoutAction() {
  if (!isSupabaseConfigured()) {
    redirect("/admin/setup");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
