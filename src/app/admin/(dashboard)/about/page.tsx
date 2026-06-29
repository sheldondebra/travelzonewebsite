import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { AboutTeamList } from "@/components/admin/AboutTeamList";
import {
  listAdminAboutTeamMembers,
  seedDefaultAboutTeamMembersIfEmpty,
} from "@/lib/about-team-store";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminAboutPage() {
  const { role } = await requireStaff();

  let members = await listAdminAboutTeamMembers();
  if (members.length === 0) {
    try {
      await seedDefaultAboutTeamMembersIfEmpty();
      members = await listAdminAboutTeamMembers();
    } catch {
      // Table may not exist yet — AboutTeamList shows import/setup guidance.
    }
  }

  return (
    <>
      <AdminPageHeader
        title="About page team"
        description="Manage the people shown on your public About Us page. Edit names, roles, photos, and bios — or add new team members."
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
