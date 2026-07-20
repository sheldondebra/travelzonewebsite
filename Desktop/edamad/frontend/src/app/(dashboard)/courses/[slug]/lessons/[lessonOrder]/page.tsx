import { CourseContentView } from "@/components/edamad/course-content-view";

export default async function CourseLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonOrder: string }>;
}) {
  const { slug, lessonOrder } = await params;
  const order = Math.max(1, parseInt(lessonOrder, 10) || 1);

  return <CourseContentView courseSlug={slug} lessonOrder={order} />;
}
