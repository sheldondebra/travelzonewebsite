import { UsersDashboard } from "@/components/admin/UsersDashboard";
import { listStaffUsers } from "@/app/admin/actions/users";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminUsersPage() {
  const { user } = await requireAdmin();
  const users = await listStaffUsers();

  return <UsersDashboard users={users} currentUserId={user.id} />;
}
