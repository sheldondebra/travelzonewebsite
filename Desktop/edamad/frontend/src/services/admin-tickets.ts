import api, { prepareApiRequest } from "@/lib/api";

export type TicketStatus = "Open" | "In Progress" | "Resolved";
export type TicketPriority = "Low" | "Medium" | "High";

export type AdminTicket = {
  id: string;
  ticket_id: number;
  subject: string;
  message?: string | null;
  category?: string | null;
  user: string;
  email?: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  date: string;
  created_at?: string;
  updated_at?: string;
  admin_notes?: string | null;
  user_id?: number | null;
};

export type AdminTicketFilters = {
  search?: string;
  status?: "all" | TicketStatus;
  priority?: "all" | TicketPriority;
};

export type AdminTicketUpdatePayload = {
  status?: TicketStatus;
  priority?: TicketPriority;
  admin_notes?: string | null;
};

export async function fetchAdminTickets(filters: AdminTicketFilters = {}) {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status && filters.status !== "all") params.status = filters.status;
  if (filters.priority && filters.priority !== "all") params.priority = filters.priority;

  const { data } = await api.get<AdminTicket[]>("/admin/tickets", { params });
  return data;
}

export async function fetchAdminTicket(id: number) {
  const { data } = await api.get<AdminTicket>(`/admin/tickets/${id}`);
  return data;
}

export async function updateAdminTicket(id: number, payload: AdminTicketUpdatePayload) {
  await prepareApiRequest();
  const { data } = await api.patch<{ message: string; ticket: AdminTicket }>(`/admin/tickets/${id}`, payload);
  return data;
}

export async function deleteAdminTicket(id: number) {
  await prepareApiRequest();
  const { data } = await api.delete<{ message: string }>(`/admin/tickets/${id}`);
  return data;
}
