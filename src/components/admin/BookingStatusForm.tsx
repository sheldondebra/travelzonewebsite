"use client";

import { useTransition } from "react";
import type { BookingStatus } from "@/lib/bookings";
import { updateBookingStatusAction } from "@/app/admin/actions/bookings";
import { useAdminAsyncAction } from "@/components/admin/AdminToastProvider";

type Props = {
  bookingId: string;
  currentStatus: BookingStatus;
};

export function BookingStatusForm({ bookingId, currentStatus }: Props) {
  const [pending, startTransition] = useTransition();
  const runAction = useAdminAsyncAction();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await runAction(
            () =>
              updateBookingStatusAction(
                bookingId,
                formData.get("status") as BookingStatus,
              ),
            { loadingMessage: "Updating booking…" },
          );
        });
      }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor="status" className="admin-label">
            Booking status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={currentStatus}
            className="admin-input"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : "Update status"}
        </button>
      </div>
    </form>
  );
}
