import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "admin" | "editor";

function roleFromJwt(appMetadata: Record<string, unknown> | undefined): StaffRole | null {
  const role = appMetadata?.role;
  if (role === "admin" || role === "editor") return role;
  return null;
}

export async function getStaffUser() {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    if (!profile.is_active) return null;
    if (profile.role === "admin" || profile.role === "editor") {
      return { user, role: profile.role as StaffRole };
    }
    return null;
  }

  const role = roleFromJwt(user.app_metadata);
  if (!role) return null;

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
