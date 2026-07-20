import api, { prepareApiRequest } from "@/lib/api";
import type { User, UserRole } from "@/types";

export type AdminUser = User & {
  enrollments_count?: number;
};

export type AdminUsersParams = {
  search?: string;
  status?: "verified" | "unverified";
  role?: UserRole;
};

export type CreateAdminUserPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  role: UserRole;
  verified?: boolean;
};

export type UpdateAdminUserPayload = {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: UserRole;
};

export async function fetchAdminUsers(params?: AdminUsersParams) {
  const { data } = await api.get<AdminUser[]>("/admin/users", { params });
  return data;
}

export async function createAdminUser(payload: CreateAdminUserPayload) {
  await prepareApiRequest();
  const { data } = await api.post<{ message: string; user: AdminUser }>("/admin/users", payload);
  return data;
}

export async function updateAdminUser(userId: number, payload: UpdateAdminUserPayload) {
  await prepareApiRequest();
  const { data } = await api.patch<{ message: string; user: AdminUser }>(`/admin/users/${userId}`, payload);
  return data;
}

export async function adminResetUserPassword(
  userId: number,
  payload: { password: string; password_confirmation: string },
) {
  await prepareApiRequest();
  const { data } = await api.post<{ message: string; user: AdminUser }>(
    `/admin/users/${userId}/reset-password`,
    payload,
  );
  return data;
}

export async function adminVerifyUser(userId: number) {
  await prepareApiRequest();
  const { data } = await api.post<{ message: string; user: AdminUser }>(`/admin/users/${userId}/verify`);
  return data;
}

export async function adminUnverifyUser(userId: number) {
  await prepareApiRequest();
  const { data } = await api.post<{ message: string; user: AdminUser }>(`/admin/users/${userId}/unverify`);
  return data;
}

export async function deleteAdminUser(userId: number) {
  await prepareApiRequest();
  const { data } = await api.delete<{ message: string }>(`/admin/users/${userId}`);
  return data;
}
