"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { TourBooking } from "@/lib/bookings";
import {
  bookingAmountLabel,
  formatBookingDateTime,
  formatTravelDate,
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

export function BookingsList({ bookings }: Props) {
  const [filter, setFilter] = useState<BookingFilter>("all");
  const [query, setQuery] = useState("");

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
          placeholder="Search bookings"
          className="admin-input w-full sm:max-w-xs"
        />
      </div>

      <div className="admin-postbox overflow-hidden p-0">
        <div className="admin-table-scroll">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th>Booking</th>
              <th>Customer</th>
              <th>Tour</th>
              <th>Travel</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-[#646970]">
                  {bookings.length === 0
                    ? "No bookings yet."
                    : "No bookings match your filter."}
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
                    <td>{booking.tourTitle}</td>
                    <td className="text-[#646970]">
                      {formatTravelDate(booking.travelDate)}
                    </td>
                    <td>
                      <StatusBadge status={booking.paymentStatus} />
                      <div>{formatPrice(amount.amount)}</div>
                    </td>
                    <td>
                      <StatusBadge status={booking.status} />
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
