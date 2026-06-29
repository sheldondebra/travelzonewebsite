"use client";

import { useTransition } from "react";
import type { ConsultationStatus } from "@/lib/consultations";
import { updateConsultationStatusAction } from "@/app/admin/actions/consultations";
import { useAdminAsyncAction } from "@/components/admin/AdminToastProvider";

type Props = {
  bookingId: string;
  currentStatus: ConsultationStatus;
};

export function ConsultationStatusForm({ bookingId, currentStatus }: Props) {
  const [pending, startTransition] = useTransition();
  const runAction = useAdminAsyncAction();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await runAction(
            () =>
              updateConsultationStatusAction(
                bookingId,
                formData.get("status") as ConsultationStatus,
              ),
            { loadingMessage: "Updating consultation…" },
          );
        });
      }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor="status" className="admin-label">
            Consultation status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={currentStatus}
            className="admin-input"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
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
