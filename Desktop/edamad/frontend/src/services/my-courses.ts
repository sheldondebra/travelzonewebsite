import api from "@/lib/api";
import type { MyCourse } from "@/types/my-courses";

export async function fetchMyCourses(): Promise<MyCourse[]> {
  const { data } = await api.get<MyCourse[]>("/my-courses");
  return data;
}
