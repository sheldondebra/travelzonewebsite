import api, { prepareApiRequest } from "@/lib/api";

export type SupportTicketCategory = "account" | "courses" | "payments" | "certificates" | "general";
export type SupportTicketStatus = "Open" | "In Progress" | "Resolved";
export type SupportTicketPriority = "Low" | "Medium" | "High";

export type SupportTicket = {
  id: number;
  number: string;
  subject: string;
  message?: string | null;
  category?: string | null;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  created_at?: string;
  updated_at?: string;
  admin_notes?: string | null;
};

export type CreateSupportTicketPayload = {
  subject: string;
  message: string;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
};

export async function fetchSupportTickets() {
  const { data } = await api.get<SupportTicket[]>("/support/tickets");
  return data;
}

export async function createSupportTicket(payload: CreateSupportTicketPayload) {
  await prepareApiRequest();
  const { data } = await api.post<{ message: string; ticket: SupportTicket }>("/support/tickets", payload);
  return data;
}

export async function fetchSupportTicket(id: number) {
  const { data } = await api.get<SupportTicket>(`/support/tickets/${id}`);
  return data;
}

export function formatTicketDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ticketStatusStyle(status: SupportTicketStatus) {
  switch (status) {
    case "Open":
      return "bg-[#FEE2E2] text-[#991B1B]";
    case "In Progress":
      return "bg-[#FFEDD5] text-[#9A3412]";
    case "Resolved":
      return "bg-[#DCFCE7] text-[#166534]";
    default:
      return "bg-[#F3F4F6] text-[#6B7280]";
  }
}
