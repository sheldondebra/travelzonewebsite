import { PracticeSubjectDashboard } from "@/components/edamad/practice-subject-dashboard";

export default async function PracticeSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  return <PracticeSubjectDashboard subjectSlug={subject} />;
}
