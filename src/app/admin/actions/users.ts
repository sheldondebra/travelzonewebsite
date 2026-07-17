"use server";

import { revalidatePath } from "next/cache";
import {
  createStaffUser,
  deleteStaffUser,
  listActiveStaffUsers,
  requireAdmin,
  updateStaffUserRole,
  type StaffRole,
} from "@/lib/auth/staff";
import { isStaffRole } from "@/lib/staff-roles";

export type UsersActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function listStaffUsers() {
  await requireAdmin();
  const users = await listActiveStaffUsers();

  return users.map((user) => ({
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

  if (!email) {
    return { success: false, error: "Email address is required." };
  }

  if (!isStaffRole(roleValue)) {
    return { success: false, error: "Choose a valid role." };
  }

  if (password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters.",
    };
  }

  await createStaffUser({ email, password, role: roleValue });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return {
    success: true,
    message: staff.user.email === email ? "Your account was updated." : "User added.",
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

  await updateStaffUserRole(userId, roleValue);

  revalidatePath("/admin");
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

  await deleteStaffUser(userId);

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return { success: true, message: "User deleted." };
}
