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
        description="Manage staff accounts, roles, and access to the dashboard."
        actions={
          <Link href="/admin/users/new" className="admin-button-primary">
            Add New
          </Link>
        }
      />
      <UsersList users={users} currentUserId={currentUserId} />
    </>
  );
}
