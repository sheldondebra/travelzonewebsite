import api, { prepareApiRequest } from "@/lib/api";

export type AdminFaq = {
  id: number;
  category: "account" | "courses" | "payments" | "certificates" | "general";
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AdminFaqPayload = {
  category: AdminFaq["category"];
  question: string;
  answer: string;
  sort_order?: number;
  is_active?: boolean;
};

export async function fetchAdminFaqs(filters: { search?: string; category?: string } = {}) {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.category && filters.category !== "all") params.category = filters.category;
  const { data } = await api.get<AdminFaq[]>("/admin/faqs", { params });
  return data;
}

export async function createAdminFaq(payload: AdminFaqPayload) {
  await prepareApiRequest();
  const { data } = await api.post<{ message: string; faq: AdminFaq }>("/admin/faqs", payload);
  return data;
}

export async function updateAdminFaq(id: number, payload: Partial<AdminFaqPayload>) {
  await prepareApiRequest();
  const { data } = await api.patch<{ message: string; faq: AdminFaq }>(`/admin/faqs/${id}`, payload);
  return data;
}

export async function deleteAdminFaq(id: number) {
  await prepareApiRequest();
  const { data } = await api.delete<{ message: string }>(`/admin/faqs/${id}`);
  return data;
}

export type PublicFaq = {
  id: string;
  question: string;
  answer: string;
  category?: string;
};

export async function fetchPublicFaqs() {
  const { data } = await api.get<PublicFaq[]>("/faqs");
  return data;
}
