import Link from "next/link";
import { AboutTeamMemberForm } from "@/components/admin/AboutTeamMemberForm";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { requireStaff } from "@/lib/supabase/auth";

export default async function AdminNewAboutTeamMemberPage() {
  await requireStaff();

  return (
    <>
      <AdminPageHeader
        title="Add team member"
        description="Create a profile for the About Us page."
        actions={
          <Link href="/admin/about" className="admin-button-secondary">
            Back to About team
          </Link>
        }
      />
      <AboutTeamMemberForm />
    </>
  );
}
