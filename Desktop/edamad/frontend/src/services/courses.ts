import api from "@/lib/api";
import type { Course } from "@/types";
import type { CourseContentResponse } from "@/types/course-content";

export type CourseSort = "default" | "price_asc" | "price_desc" | "title_asc" | "title_desc";

export async function fetchStoreCourses(params?: {
  search?: string;
  sort?: CourseSort;
}): Promise<Course[]> {
  const { data } = await api.get<Course[]>("/store/courses", {
    params: {
      search: params?.search || undefined,
      sort: params?.sort && params.sort !== "default" ? params.sort : undefined,
    },
  });
  return data;
}

export async function fetchCourseContent(
  slug: string,
  lessonOrder = 1,
): Promise<CourseContentResponse> {
  const { data } = await api.get<CourseContentResponse>(`/courses/${slug}/content`, {
    params: { lesson: lessonOrder },
  });
  return data;
}

export type MyCourse = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  icon: string;
  icon_bg: string;
  lessons_count: number;
  progress_percent: number;
};

export async function fetchMyCourses(): Promise<MyCourse[]> {
  const { data } = await api.get<MyCourse[]>("/my-courses");
  return data;
}
