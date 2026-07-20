import { redirect } from "next/navigation";

export default async function CourseLessonsIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/courses/${slug}/lessons/1`);
}
