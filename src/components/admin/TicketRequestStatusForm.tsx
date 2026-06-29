"use client";

import { useTransition } from "react";
import type { TicketRequestStatus } from "@/lib/ticket-requests";
import { updateTicketRequestStatusAction } from "@/app/admin/actions/tickets";
import { useAdminAsyncAction } from "@/components/admin/AdminToastProvider";

type Props = {
  requestId: string;
  currentStatus: TicketRequestStatus;
};

export function TicketRequestStatusForm({ requestId, currentStatus }: Props) {
  const [pending, startTransition] = useTransition();
  const runAction = useAdminAsyncAction();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await runAction(
            () =>
              updateTicketRequestStatusAction(
                requestId,
                formData.get("status") as TicketRequestStatus,
              ),
            { loadingMessage: "Updating ticket request…" },
          );
        });
      }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor="status" className="admin-label">
            Request status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={currentStatus}
            className="admin-input"
          >
            <option value="pending">Pending review</option>
            <option value="quoted">Quote sent</option>
            <option value="booked">Booked</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : "Update status"}
        </button>
      </div>
      <p className="admin-field-hint mt-0">
        Mark as quoted when you&apos;ve sent fare options. Mark booked once the ticket is issued
        offline.
      </p>
    </form>
  );
}
