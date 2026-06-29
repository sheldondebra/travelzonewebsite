import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { AboutTeamList } from "@/components/admin/AboutTeamList";
import { listAdminAboutTeamMembers } from "@/lib/about-team-store";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminAboutPage() {
  const { role } = await requireStaff();
  const members = await listAdminAboutTeamMembers();

  return (
    <>
      <AdminPageHeader
        title="About page team"
        description="Manage the people shown on your public About Us page. This is separate from dashboard login accounts under Users."
        actions={
          <>
            <Link href="/about" target="_blank" className="admin-button-secondary">
              View About page
            </Link>
            <Link href="/admin/about/new" className="admin-button-primary">
              Add team member
            </Link>
          </>
        }
      />
      <AboutTeamList members={members} role={role} />
    </>
  );
}
