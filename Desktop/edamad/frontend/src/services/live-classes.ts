import api from "@/lib/api";
import type { LiveLectureResponse } from "@/types/live-classes";

export async function fetchFeaturedLiveLecture(): Promise<LiveLectureResponse> {
  const { data } = await api.get<LiveLectureResponse>("/live-classes/featured");
  return data;
}

export async function fetchLiveLecture(slug: string): Promise<LiveLectureResponse> {
  const { data } = await api.get<LiveLectureResponse>(`/live-classes/${slug}`);
  return data;
}
