"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { ConsultationBooking } from "@/lib/consultations";
import {
  formatConsultationDate,
  formatConsultationDateTime,
  getConsultationStats,
  matchesConsultationFilter,
  matchesConsultationSearch,
  type ConsultationFilter,
} from "@/lib/consultation-admin";
import { getModeLabel, getTimeSlotLabel, getTopicLabel } from "@/lib/consultations";

type Props = {
  bookings: ConsultationBooking[];
};

const filters: { id: ConsultationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export function ConsultationsList({ bookings }: Props) {
  const [filter, setFilter] = useState<ConsultationFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          matchesConsultationFilter(booking, filter) &&
          matchesConsultationSearch(booking, query),
      ),
    [bookings, filter, query],
  );

  return (
    <>
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ul className="admin-subsubsub">
          {filters.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={filter === item.id ? "current" : ""}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search consultations"
          className="admin-input w-full sm:max-w-xs"
        />
      </div>

      <div className="admin-postbox overflow-hidden p-0">
        <div className="admin-table-scroll">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Customer</th>
              <th>Appointment</th>
              <th>Topic</th>
              <th>Mode</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-[#646970]">
                  {bookings.length === 0
                    ? "No consultation bookings yet."
                    : "No consultations match your filter."}
                </td>
              </tr>
            ) : (
              filtered.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <Link
                      href={`/admin/consultations/${booking.id}`}
                      className="admin-row-title"
                    >
                      {booking.id}
                    </Link>
                    <div className="admin-row-actions text-[#646970]">
                      {formatConsultationDateTime(booking.createdAt)}
                    </div>
                  </td>
                  <td>
                    <strong>{booking.fullName}</strong>
                    <div className="text-[#646970]">{booking.email}</div>
                  </td>
                  <td className="text-[#646970]">
                    {formatConsultationDate(booking.preferredDate)}
                    <div>{getTimeSlotLabel(booking.preferredTime)}</div>
                  </td>
                  <td>{getTopicLabel(booking.topic)}</td>
                  <td>{getModeLabel(booking.mode)}</td>
                  <td>
                    <StatusBadge status={booking.status} />
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

export function ConsultationsSummary({ bookings }: Props) {
  const stats = getConsultationStats(bookings);

  return (
    <ul className="admin-glance-list">
      <li>
        <strong>{stats.total}</strong> total requests
      </li>
      <li>
        <strong>{stats.pending}</strong> pending
      </li>
      <li>
        <strong>{stats.confirmed}</strong> confirmed
      </li>
      <li>
        <strong>{stats.completed}</strong> completed
      </li>
    </ul>
  );
}
