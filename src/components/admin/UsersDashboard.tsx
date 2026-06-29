import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { UsersList } from "@/components/admin/UsersList";

type StaffUser = {
  id: string;
  email: string;
  role: import("@/lib/supabase/auth").StaffRole;
  createdAt: string;
};

type Props = {
  users: StaffUser[];
  currentUserId: string;
};

export function UsersDashboard({ users, currentUserId }: Props) {
  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Manage staff login accounts for the admin dashboard. For public About page profiles, use About team."
        actions={
          <Link href="/admin/users/new" className="admin-button-primary">
            Add user
          </Link>
        }
      />
      <UsersList users={users} currentUserId={currentUserId} />
    </>
  );
}
