"use client";

import { useTransition } from "react";
import type { ContactMessageStatus } from "@/lib/contact-messages";
import { updateContactMessageStatusAction } from "@/app/admin/actions/messages";
import { useAdminAsyncAction } from "@/components/admin/AdminToastProvider";

type Props = {
  messageId: string;
  currentStatus: ContactMessageStatus;
};

export function ContactMessageStatusForm({ messageId, currentStatus }: Props) {
  const [pending, startTransition] = useTransition();
  const runAction = useAdminAsyncAction();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await runAction(
            () =>
              updateContactMessageStatusAction(
                messageId,
                formData.get("status") as ContactMessageStatus,
              ),
            { loadingMessage: "Updating message…" },
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
    </form>
  );
}
