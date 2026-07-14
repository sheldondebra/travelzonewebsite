"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, type StaffRole } from "@/lib/supabase/auth";
import {
  deleteStaffUserRecord,
  updateStaffUserRole,
  upsertStaffUserRecord,
} from "@/lib/staff-users";
import { isStaffRole } from "@/lib/staff-roles";

export type UsersActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function listStaffUsers() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("id, email, role, created_at")
    .eq("is_active", true)
    .order("email");

  if (error) throw new Error(error.message);

  return (data ?? []).map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role as StaffRole,
    createdAt: user.created_at,
  }));
}

export async function createStaffAction(
  _prev: UsersActionResult | undefined,
  formData: FormData,
): Promise<UsersActionResult> {
  const staff = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleValue = String(formData.get("role") ?? "editor");
  const sendInvite = formData.get("sendInvite") === "on";

  if (!email) {
    return { success: false, error: "Email address is required." };
  }

  if (!isStaffRole(roleValue)) {
    return { success: false, error: "Choose a valid role." };
  }

  const admin = createAdminClient();
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  if (sendInvite) {
    if (password) {
      return {
        success: false,
        error: "Leave the password blank when sending an invitation email.",
      };
    }

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/admin/login`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      const { error: updateError } = await admin.auth.admin.updateUserById(
        data.user.id,
        { app_metadata: { role: roleValue } },
      );
      if (updateError) {
        return { success: false, error: updateError.message };
      }

      await upsertStaffUserRecord({
        id: data.user.id,
        email: data.user.email ?? email,
        role: roleValue,
      });
    }

    revalidatePath("/admin/users");
    return { success: true, message: "Invitation sent." };
  }

  if (password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters, or send an invitation instead.",
    };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: roleValue },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    await upsertStaffUserRecord({
      id: data.user.id,
      email: data.user.email ?? email,
      role: roleValue,
    });
  }

  revalidatePath("/admin/users");
  return {
    success: true,
    message: staff.user.email === email ? "Your account was updated." : "User created.",
  };
}

export async function updateStaffRoleAction(
  _prev: UsersActionResult | undefined,
  formData: FormData,
): Promise<UsersActionResult> {
  const staff = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const roleValue = String(formData.get("role") ?? "");

  if (!userId) {
    return { success: false, error: "User not found." };
  }

  if (!isStaffRole(roleValue)) {
    return { success: false, error: "Choose a valid role." };
  }

  if (userId === staff.user.id && roleValue !== "admin") {
    return {
      success: false,
      error: "You cannot remove your own administrator access.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: roleValue },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await updateStaffUserRole(userId, roleValue);

  revalidatePath("/admin/users");
  return { success: true, message: "User role updated." };
}

export async function deleteStaffAction(
  _prev: UsersActionResult | undefined,
  formData: FormData,
): Promise<UsersActionResult> {
  const staff = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return { success: false, error: "User not found." };
  }

  if (userId === staff.user.id) {
    return { success: false, error: "You cannot delete your own account." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "User deleted." };
}
