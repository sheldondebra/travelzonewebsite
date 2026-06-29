"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { TicketRequest } from "@/lib/ticket-requests";
import { getCabinClassLabel, getTripTypeLabel } from "@/lib/ticket-requests";
import {
  formatTicketDate,
  formatTicketDateTime,
  getTicketRequestStats,
  matchesTicketRequestFilter,
  matchesTicketRequestSearch,
  type TicketRequestFilter,
} from "@/lib/ticket-request-admin";

type Props = {
  requests: TicketRequest[];
};

const filters: { id: TicketRequestFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "quoted", label: "Quoted" },
  { id: "booked", label: "Booked" },
  { id: "cancelled", label: "Cancelled" },
];

function filterCount(requests: TicketRequest[], filter: TicketRequestFilter) {
  if (filter === "all") return requests.length;
  return requests.filter((request) => matchesTicketRequestFilter(request, filter)).length;
}

export function TicketRequestsList({ requests }: Props) {
  const [filter, setFilter] = useState<TicketRequestFilter>("all");
  const [query, setQuery] = useState("");
  const stats = getTicketRequestStats(requests);

  const filtered = useMemo(
    () =>
      requests.filter(
        (request) =>
          matchesTicketRequestFilter(request, filter) &&
          matchesTicketRequestSearch(request, query),
      ),
    [requests, filter, query],
  );

  return (
    <>
      <div className="admin-tickets-top">
        <div className="admin-tickets-stats">
          <div className="admin-tickets-stat">
            <span className="admin-tickets-stat-value">{stats.total}</span>
            <span className="admin-tickets-stat-label">Total</span>
          </div>
          <div className="admin-tickets-stat">
            <span className="admin-tickets-stat-value">{stats.pending}</span>
            <span className="admin-tickets-stat-label">Pending</span>
          </div>
          <div className="admin-tickets-stat">
            <span className="admin-tickets-stat-value">{stats.quoted}</span>
            <span className="admin-tickets-stat-label">Quoted</span>
          </div>
          <div className="admin-tickets-stat">
            <span className="admin-tickets-stat-value">{stats.booked}</span>
            <span className="admin-tickets-stat-label">Booked</span>
          </div>
        </div>

        <div className="admin-tickets-toolbar">
          <ul className="admin-subsubsub">
            {filters.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={filter === item.id ? "current" : ""}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label} ({filterCount(requests, item.id)})
                </button>
              </li>
            ))}
          </ul>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by reference, route, customer…"
            className="admin-input w-full"
            aria-label="Search ticket requests"
          />
        </div>
      </div>

      <div className="admin-postbox overflow-hidden p-0">
        <div className="admin-table-scroll">
          <table className="admin-list-table admin-tickets-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Route</th>
                <th>Customer</th>
                <th className="hidden md:table-cell">Travel</th>
                <th>Status</th>
                <th className="hidden lg:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#646970]">
                    {requests.length === 0
                      ? "No ticket requests yet. They will appear here when customers submit the form on /tickets."
                      : "No requests match your search or filter."}
                  </td>
                </tr>
              ) : (
                filtered.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <Link href={`/admin/tickets/${request.id}`} className="admin-row-title">
                        {request.id}
                      </Link>
                      <div className="admin-row-actions text-[#646970]">
                        {formatTicketDateTime(request.createdAt)}
                      </div>
                    </td>
                    <td className="min-w-[160px]">
                      <strong>{request.origin}</strong>
                      <div className="text-[#646970]">→ {request.destination}</div>
                      <div className="text-[12px] text-[#646970]">
                        {getTripTypeLabel(request.tripType)} · {request.passengers} pax
                      </div>
                    </td>
                    <td>
                      <strong>{request.fullName}</strong>
                      <div className="text-[#646970]">{request.email}</div>
                    </td>
                    <td className="hidden text-[#646970] md:table-cell">
                      {formatTicketDate(request.departureDate)}
                      {request.returnDate ? (
                        <div>Return {formatTicketDate(request.returnDate)}</div>
                      ) : null}
                      <div>{getCabinClassLabel(request.cabinClass)}</div>
                    </td>
                    <td>
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="hidden lg:table-cell">
                      <div className="admin-row-actions">
                        <Link href={`/admin/tickets/${request.id}`}>View</Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
