"use client";

import { useState, useTransition } from "react";
import type { ConsultationStatus } from "@/lib/consultations";
import { updateConsultationStatusAction } from "@/app/admin/actions/consultations";

type Props = {
  bookingId: string;
  currentStatus: ConsultationStatus;
};

export function ConsultationStatusForm({ bookingId, currentStatus }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await updateConsultationStatusAction(
            bookingId,
            formData.get("status") as ConsultationStatus,
          );
          setMessage(
            result.success
              ? { type: "success", text: result.message }
              : { type: "error", text: result.error },
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
      {message ? (
        <p
          className={`rounded-[3px] px-2 py-2 text-[13px] ${
            message.type === "success"
              ? "admin-notice admin-notice-success"
              : "admin-notice admin-notice-error"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
