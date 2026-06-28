import type { ContactMessage } from "@/lib/contact-messages";
import { formatBookingDateTime } from "@/lib/booking-admin";

export type ContactMessageFilter = "all" | "pending" | "read" | "archived";

export function getContactMessageStats(messages: ContactMessage[]) {
  return {
    total: messages.length,
    pending: messages.filter((message) => message.status === "pending").length,
    read: messages.filter((message) => message.status === "read").length,
    archived: messages.filter((message) => message.status === "archived").length,
  };
}

export function formatContactMessageDateTime(iso: string) {
  return formatBookingDateTime(iso);
}

export function matchesContactMessageFilter(
  message: ContactMessage,
  filter: ContactMessageFilter,
) {
  if (filter === "all") return true;
  return message.status === filter;
}

export function matchesContactMessageSearch(message: ContactMessage, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    message.id,
    message.fullName,
    message.email,
    message.phone,
    message.subject,
    message.message,
  ].some((value) => value.toLowerCase().includes(normalized));
}
