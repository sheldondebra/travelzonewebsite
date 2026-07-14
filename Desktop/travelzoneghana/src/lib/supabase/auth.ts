import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "admin" | "editor";

export async function getStaffUser() {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const role = user.app_metadata?.role as StaffRole | undefined;
  if (role !== "admin" && role !== "editor") return null;

  return { user, role };
}

export async function requireStaff() {
  if (!isSupabaseConfigured()) redirect("/admin/setup");
  const staff = await getStaffUser();
  if (!staff) redirect("/admin/login");
  return staff;
}

export async function requireAdmin() {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin?error=forbidden");
  return staff;
}
