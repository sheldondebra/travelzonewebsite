import api from "@/lib/api";

export type Announcement = {
  id: number;
  title: string;
  body: string;
  audience: "all" | "students" | "admins";
  published_at?: string | null;
};

export async function fetchAnnouncements() {
  const { data } = await api.get<Announcement[]>("/announcements");
  return data;
}
