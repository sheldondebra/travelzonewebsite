import api from "@/lib/api";
import type { CourseFormState } from "@/lib/create-course-data";
import { formToPayload } from "@/lib/create-course-data";

export type AdminCourse = {
  id: number;
  title: string;
  slug: string;
  course_code?: string | null;
  category?: string | null;
  instructor?: string | null;
  difficulty?: string | null;
  price: string;
  is_published: boolean;
  is_active: boolean;
  lessons_count?: number;
  enrollments_count?: number;
  created_at: string;
  icon?: string;
  icon_bg?: string;
  short_description?: string | null;
};

export type AdminCourseFilters = {
  search?: string;
  status?: "all" | "published" | "draft";
  category?: string;
};

export type UpdateAdminCoursePayload = {
  title?: string;
  course_code?: string;
  category?: string;
  instructor?: string;
  difficulty?: string;
  duration_label?: string;
  short_description?: string;
  price?: number | string;
  is_published?: boolean;
  is_active?: boolean;
};

export async function fetchAdminCourses(filters: AdminCourseFilters = {}): Promise<AdminCourse[]> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status && filters.status !== "all") params.status = filters.status;
  if (filters.category) params.category = filters.category;

  const { data } = await api.get<AdminCourse[]>("/admin/courses", { params });
  return data;
}

export async function fetchAdminCourse(courseId: number) {
  const { data } = await api.get(`/admin/courses/${courseId}`);
  return data;
}

export async function updateAdminCourse(courseId: number, payload: UpdateAdminCoursePayload) {
  const { data } = await api.patch<{ message: string; course: AdminCourse }>(
    `/admin/courses/${courseId}`,
    payload,
  );
  return data;
}

export async function toggleAdminCoursePublish(courseId: number) {
  const { data } = await api.post<{ message: string; course: AdminCourse }>(
    `/admin/courses/${courseId}/toggle-publish`,
  );
  return data;
}

export async function deleteAdminCourse(courseId: number) {
  const { data } = await api.delete<{ message: string }>(`/admin/courses/${courseId}`);
  return data;
}

export async function uploadVideo(file: File, onProgress?: (pct: number) => void) {
  const formData = new FormData();
  formData.append("video", file);
  const { data } = await api.post<{
    url: string;
    size: number;
    format: string;
    filename: string;
  }>("/videos/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
  return data;
}

export async function createVideoLesson(payload: Record<string, unknown>) {
  const { data } = await api.post("/admin/lessons", payload);
  return data;
}

export async function createCourse(form: CourseFormState, publish: boolean) {
  const payload = formToPayload(form, publish);
  const { data } = await api.post("/courses", payload);
  return data;
}

export async function uploadCourseMedia(
  type: "thumbnail" | "banner" | "lesson",
  file: File,
  onProgress?: (pct: number) => void,
) {
  const formData = new FormData();
  formData.append("type", type);
  formData.append("file", file);

  const { data } = await api.post<{ url: string }>("/admin/media/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
  return data.url;
}
