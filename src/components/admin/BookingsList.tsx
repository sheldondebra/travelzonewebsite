"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { TourBooking } from "@/lib/bookings";
import {
  bookingAmountLabel,
  formatBookingDateTime,
  formatTravelDate,
  getBookingStats,
  matchesBookingFilter,
  matchesBookingSearch,
  type BookingFilter,
} from "@/lib/booking-admin";
import { formatPrice } from "@/lib/tours";

type Props = {
  bookings: TourBooking[];
};

const filters: { id: BookingFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending-payment", label: "Awaiting payment" },
  { id: "paid", label: "Paid" },
  { id: "pending-review", label: "Pending review" },
  { id: "confirmed", label: "Confirmed" },
  { id: "cancelled", label: "Cancelled" },
];

const statItems = [
  { key: "total", label: "Total bookings" },
  { key: "pendingPayment", label: "Awaiting payment" },
  { key: "paid", label: "Paid" },
  { key: "pendingReview", label: "Pending review" },
  { key: "confirmed", label: "Confirmed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

function filterCount(bookings: TourBooking[], filter: BookingFilter) {
  if (filter === "all") return bookings.length;
  return bookings.filter((booking) => matchesBookingFilter(booking, filter)).length;
}

export function BookingsList({ bookings }: Props) {
  const [filter, setFilter] = useState<BookingFilter>("all");
  const [query, setQuery] = useState("");
  const stats = getBookingStats(bookings);

  const filtered = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          matchesBookingFilter(booking, filter) && matchesBookingSearch(booking, query),
      ),
    [bookings, filter, query],
  );

  return (
    <>
      <div className="admin-bookings-top">
        <div className="admin-bookings-stats">
          {statItems.map((item) => (
            <div key={item.key} className="admin-bookings-stat">
              <span className="admin-bookings-stat-value">{stats[item.key]}</span>
              <span className="admin-bookings-stat-label">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="admin-bookings-toolbar">
          <ul className="admin-subsubsub">
            {filters.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={filter === item.id ? "current" : ""}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label} ({filterCount(bookings, item.id)})
                </button>
              </li>
            ))}
          </ul>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by reference, name, email, tour…"
            className="admin-input w-full"
            aria-label="Search bookings"
          />
        </div>
      </div>

      <div className="admin-postbox overflow-hidden p-0">
        <div className="admin-table-scroll">
          <table className="admin-list-table admin-bookings-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Tour</th>
                <th className="hidden md:table-cell">Travel</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="hidden lg:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#646970]">
                    {bookings.length === 0 ? (
                      <div className="space-y-3">
                        <p>No tour bookings yet. They will appear here when customers book from the site.</p>
                        <Link href="/book" target="_blank" className="admin-button-secondary">
                          View book page
                        </Link>
                      </div>
                    ) : (
                      "No bookings match your search or filter."
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((booking) => {
                  const amount = bookingAmountLabel(booking);
                  return (
                    <tr key={booking.id}>
                      <td>
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="admin-row-title"
                        >
                          {booking.id}
                        </Link>
                        <div className="admin-row-actions text-[#646970]">
                          {formatBookingDateTime(booking.createdAt)}
                        </div>
                      </td>
                      <td>
                        <strong>{booking.fullName}</strong>
                        <div className="text-[#646970]">{booking.email}</div>
                      </td>
                      <td className="min-w-[160px]">{booking.tourTitle}</td>
                      <td className="hidden text-[#646970] md:table-cell">
                        {formatTravelDate(booking.travelDate)}
                        <div>
                          {booking.travelers} traveler{booking.travelers === 1 ? "" : "s"}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold text-[#1d2327]">
                          {formatPrice(amount.amount)}
                        </div>
                        <StatusBadge status={booking.paymentStatus} />
                      </td>
                      <td>
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="hidden lg:table-cell">
                        <div className="admin-row-actions">
                          <Link href={`/admin/bookings/${booking.id}`}>View</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
