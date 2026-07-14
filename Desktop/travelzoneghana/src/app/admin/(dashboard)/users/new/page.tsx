import Link from "next/link";
import { AddUserForm } from "@/components/admin/AddUserForm";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { requireAdmin } from "@/lib/supabase/auth";

type Props = {
  searchParams: Promise<{ email?: string }>;
};

export default async function AdminNewUserPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;

  return (
    <>
      <AdminPageHeader
        title="Add New User"
        description="Create a staff account and choose what they can access."
        actions={
          <Link href="/admin/users" className="admin-button-secondary">
            Back to Users
          </Link>
        }
      />
      <AddUserForm defaultEmail={params.email ?? ""} />
    </>
  );
}
