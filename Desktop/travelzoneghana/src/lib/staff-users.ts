import { createAdminClient } from "@/lib/supabase/admin";
import type { StaffRole } from "@/lib/supabase/auth";

type UpsertStaffUserParams = {
  id: string;
  email: string;
  role: StaffRole;
  displayName?: string;
};

export async function upsertStaffUserRecord({
  id,
  email,
  role,
  displayName = "",
}: UpsertStaffUserParams) {
  const admin = createAdminClient();
  const { error } = await admin.from("users").upsert(
    {
      id,
      email: email.toLowerCase(),
      role,
      display_name: displayName,
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (error) throw new Error(error.message);
}

export async function updateStaffUserRole(userId: string, role: StaffRole) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

export async function deleteStaffUserRecord(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("users").delete().eq("id", userId);
  if (error) throw new Error(error.message);
}
