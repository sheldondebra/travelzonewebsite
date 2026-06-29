import Link from "next/link";
import { notFound } from "next/navigation";
import { AboutTeamMemberForm } from "@/components/admin/AboutTeamMemberForm";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { getAdminAboutTeamMember } from "@/lib/about-team-store";
import { requireStaff } from "@/lib/supabase/auth";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditAboutTeamMemberPage({ params }: Props) {
  await requireStaff();
  const { id } = await params;
  const member = await getAdminAboutTeamMember(id);
  if (!member) notFound();

  return (
    <>
      <AdminPageHeader
        title={member.name}
        description="Edit this profile on the About Us page."
        actions={
          <Link href="/admin/about" className="admin-button-secondary">
            Back to About team
          </Link>
        }
      />
      <AboutTeamMemberForm member={member} />
    </>
  );
}
