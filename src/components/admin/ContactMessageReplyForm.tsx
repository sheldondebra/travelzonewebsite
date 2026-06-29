"use client";

import { useActionState, useEffect, useState } from "react";
import { replyContactMessageAction } from "@/app/admin/actions/messages";
import { AdminNotice } from "@/components/admin/AdminChrome";
import { useAdminActionFeedback } from "@/components/admin/AdminToastProvider";

type Props = {
  messageId: string;
  recipientEmail: string;
  recipientPhone: string;
  emailReady: boolean;
  smsReady: boolean;
};

const SMS_MAX_LENGTH = 480;

export function ContactMessageReplyForm({
  messageId,
  recipientEmail,
  recipientPhone,
  emailReady,
  smsReady,
}: Props) {
  const [reply, setReply] = useState("");
  const [state, formAction, pending] = useActionState(replyContactMessageAction, undefined);

  useAdminActionFeedback(state, pending, {
    loadingMessage: "Sending reply…",
  });

  useEffect(() => {
    if (state?.success) {
      setReply("");
    }
  }, [state]);

  if (!emailReady && !smsReady) {
    return (
      <AdminNotice variant="warning">
        Configure Resend or SMTP under{" "}
        <a href="/admin/settings?tab=smtp" className="text-[#2271b1] underline">
          Settings → Email
        </a>{" "}
        to reply from the dashboard.
      </AdminNotice>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="messageId" value={messageId} />

      <div>
        <label htmlFor="reply-body" className="admin-label">
          Your reply
        </label>
        <textarea
          id="reply-body"
          name="reply"
          rows={6}
          required
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder="Write your response to the customer…"
          className="admin-input"
        />
        <p className="admin-field-hint">
          Email to <strong>{recipientEmail}</strong>
          {smsReady ? (
            <>
              {" "}
              · SMS to <strong>{recipientPhone}</strong> (max {SMS_MAX_LENGTH} characters)
            </>
          ) : null}
        </p>
        {smsReady && reply.length > SMS_MAX_LENGTH ? (
          <p className="admin-field-hint text-[#b32d2e]">
            SMS is over {SMS_MAX_LENGTH} characters — shorten for SMS or send email only.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[#f0f0f1] pt-3">
        {emailReady ? (
          <button
            type="submit"
            name="channel"
            value="email"
            disabled={pending || !reply.trim()}
            className="admin-login-submit sm:w-auto"
          >
            {pending ? "Sending…" : "Send email reply"}
          </button>
        ) : (
          <p className="admin-field-hint m-0">Email unavailable — enable SMTP in Settings.</p>
        )}

        {smsReady ? (
          <button
            type="submit"
            name="channel"
            value="sms"
            disabled={pending || !reply.trim() || reply.length > SMS_MAX_LENGTH}
            className="admin-button-secondary"
          >
            {pending ? "Sending…" : "Send SMS reply"}
          </button>
        ) : (
          <p className="admin-field-hint m-0">SMS unavailable — enable SplitSMS in Settings.</p>
        )}
      </div>
    </form>
  );
}