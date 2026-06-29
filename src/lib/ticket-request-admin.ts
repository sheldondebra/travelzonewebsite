import type { TicketRequest } from "@/lib/ticket-requests";
import { formatBookingDateTime, formatTravelDate } from "@/lib/booking-admin";

export type TicketRequestFilter = "all" | "pending" | "quoted" | "booked" | "cancelled";

export function getTicketRequestStats(requests: TicketRequest[]) {
  return {
    total: requests.length,
    pending: requests.filter((request) => request.status === "pending").length,
    quoted: requests.filter((request) => request.status === "quoted").length,
    booked: requests.filter((request) => request.status === "booked").length,
    cancelled: requests.filter((request) => request.status === "cancelled").length,
  };
}

export function formatTicketDate(date: string) {
  return formatTravelDate(date);
}

export function formatTicketDateTime(iso: string) {
  return formatBookingDateTime(iso);
}

export function matchesTicketRequestFilter(
  request: TicketRequest,
  filter: TicketRequestFilter,
) {
  if (filter === "all") return true;
  return request.status === filter;
}

export function matchesTicketRequestSearch(request: TicketRequest, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    request.id,
    request.fullName,
    request.email,
    request.phone,
    request.origin,
    request.destination,
    request.tripType,
    request.cabinClass,
  ].some((value) => value.toLowerCase().includes(normalized));
}
