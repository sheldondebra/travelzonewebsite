"use client";

import { useState, useTransition } from "react";
import type { ContactMessageStatus } from "@/lib/contact-messages";
import { updateContactMessageStatusAction } from "@/app/admin/actions/messages";

type Props = {
  messageId: string;
  currentStatus: ContactMessageStatus;
};

export function ContactMessageStatusForm({ messageId, currentStatus }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await updateContactMessageStatusAction(
            messageId,
            formData.get("status") as ContactMessageStatus,
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
            Message status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={currentStatus}
            className="admin-input"
          >
            <option value="pending">Pending</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
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
