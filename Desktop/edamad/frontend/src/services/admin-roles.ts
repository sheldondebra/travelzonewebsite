import api, { prepareApiRequest } from "@/lib/api";

export type AdminPermission = {
  id: number;
  name: string;
  label: string;
  group: string;
};

export type AdminRole = {
  id: number;
  name: string;
  label: string;
  is_system: boolean;
  permissions: string[];
  permissions_count: number;
  users_count: number;
  created_at?: string;
};

export type AdminPermissionsResponse = {
  permissions: AdminPermission[];
  grouped: Record<string, AdminPermission[]>;
};

export type AdminRolePayload = {
  name: string;
  permissions?: string[];
};

export async function fetchAdminRoles() {
  const { data } = await api.get<AdminRole[]>("/admin/roles");
  return data;
}

export async function fetchAdminPermissions() {
  const { data } = await api.get<AdminPermissionsResponse>("/admin/permissions");
  return data;
}

export async function createAdminRole(payload: AdminRolePayload) {
  await prepareApiRequest();
  const { data } = await api.post<{ message: string; role: AdminRole }>("/admin/roles", payload);
  return data;
}

export async function updateAdminRole(id: number, payload: Partial<AdminRolePayload>) {
  await prepareApiRequest();
  const { data } = await api.patch<{ message: string; role: AdminRole }>(`/admin/roles/${id}`, payload);
  return data;
}

export async function deleteAdminRole(id: number) {
  await prepareApiRequest();
  const { data } = await api.delete<{ message: string }>(`/admin/roles/${id}`);
  return data;
}
