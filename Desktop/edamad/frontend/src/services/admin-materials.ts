import api from "@/lib/api";

export type AdminMaterial = {
  id: string;
  name: string;
  type: "video" | "document" | "image" | "slides" | "notes";
  course: string;
  course_id: number;
  course_slug?: string | null;
  lesson?: string | null;
  lesson_id?: number | null;
  url: string;
  status: string;
  updated_at?: string;
};

export type AdminMaterialFilters = {
  search?: string;
  type?: "all" | AdminMaterial["type"];
  course?: string;
};

export type UploadAdminMaterialPayload = {
  course_id: number;
  lesson_id?: number;
  kind: "video" | "slides" | "notes" | "document" | "thumbnail" | "banner" | "other";
  name?: string;
  file: File;
};

export async function fetchAdminMaterials(filters: AdminMaterialFilters = {}) {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.type && filters.type !== "all") params.type = filters.type;
  if (filters.course) params.course = filters.course;

  const { data } = await api.get<AdminMaterial[]>("/admin/materials", { params });
  return data;
}

export async function uploadAdminMaterial(
  payload: UploadAdminMaterialPayload,
  onProgress?: (pct: number) => void,
) {
  const formData = new FormData();
  formData.append("course_id", String(payload.course_id));
  if (payload.lesson_id) formData.append("lesson_id", String(payload.lesson_id));
  formData.append("kind", payload.kind);
  if (payload.name) formData.append("name", payload.name);
  formData.append("file", payload.file);

  const { data } = await api.post<{ message: string; materials: AdminMaterial[] }>(
    "/admin/materials",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    },
  );
  return data;
}

export async function deleteAdminMaterial(materialId: string) {
  const { data } = await api.delete<{ message: string }>(`/admin/materials/${materialId}`);
  return data;
}
