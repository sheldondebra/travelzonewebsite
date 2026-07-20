import api from "@/lib/api";

export type AnnouncementAudience = "all" | "students" | "admins";
export type AnnouncementStatus = "draft" | "published";

export type AdminAnnouncement = {
  id: number;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  published_at?: string | null;
  emailed_at?: string | null;
  emails_sent_count: number;
  created_by_name?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminAnnouncementFilters = {
  search?: string;
  status?: "all" | AnnouncementStatus;
};

export type AdminAnnouncementPayload = {
  title: string;
  body: string;
  audience: AnnouncementAudience;
};

export async function fetchAdminAnnouncements(filters: AdminAnnouncementFilters = {}) {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status && filters.status !== "all") params.status = filters.status;

  const { data } = await api.get<AdminAnnouncement[]>("/admin/announcements", { params });
  return data;
}

export async function createAdminAnnouncement(payload: AdminAnnouncementPayload) {
  const { data } = await api.post<{ message: string; announcement: AdminAnnouncement }>(
    "/admin/announcements",
    payload,
  );
  return data;
}

export async function updateAdminAnnouncement(id: number, payload: Partial<AdminAnnouncementPayload>) {
  const { data } = await api.patch<{ message: string; announcement: AdminAnnouncement }>(
    `/admin/announcements/${id}`,
    payload,
  );
  return data;
}

export async function deleteAdminAnnouncement(id: number) {
  const { data } = await api.delete<{ message: string }>(`/admin/announcements/${id}`);
  return data;
}

export async function publishAdminAnnouncement(id: number, resend = false) {
  const { data } = await api.post<{ message: string; announcement: AdminAnnouncement; emails_sent: number }>(
    `/admin/announcements/${id}/publish`,
    { resend },
  );
  return data;
}
