import api from "@/lib/api";

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  sort_order: number;
  courses_count: number;
  created_at?: string;
  updated_at?: string;
};

export type AdminCategoryFilters = {
  search?: string;
  status?: "all" | "active" | "inactive";
};

export type AdminCategoryPayload = {
  name: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
};

export async function fetchAdminCategories(filters: AdminCategoryFilters = {}) {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status && filters.status !== "all") params.status = filters.status;

  const { data } = await api.get<AdminCategory[]>("/admin/categories", { params });
  return data;
}

export async function createAdminCategory(payload: AdminCategoryPayload) {
  const { data } = await api.post<{ message: string; category: AdminCategory }>(
    "/admin/categories",
    payload,
  );
  return data;
}

export async function updateAdminCategory(id: number, payload: Partial<AdminCategoryPayload>) {
  const { data } = await api.patch<{ message: string; category: AdminCategory }>(
    `/admin/categories/${id}`,
    payload,
  );
  return data;
}

export async function deleteAdminCategory(id: number) {
  const { data } = await api.delete<{ message: string }>(`/admin/categories/${id}`);
  return data;
}

export async function toggleAdminCategoryActive(id: number) {
  const { data } = await api.post<{ message: string; category: AdminCategory }>(
    `/admin/categories/${id}/toggle-active`,
  );
  return data;
}
