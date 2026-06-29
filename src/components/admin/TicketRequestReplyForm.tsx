"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { replyTicketRequestAction } from "@/app/admin/actions/tickets";
import { AdminNotice } from "@/components/admin/AdminChrome";
import { useAdminActionFeedback } from "@/components/admin/AdminToastProvider";
import type { TicketRequestStatus } from "@/lib/ticket-requests";
import { getCustomerWhatsAppUrl } from "@/lib/whatsapp";

type Props = {
  requestId: string;
  fullName: string;
  recipientEmail: string;
  recipientPhone: string;
  origin: string;
  destination: string;
  status: TicketRequestStatus;
  emailReady: boolean;
  smsReady: boolean;
};

const SMS_MAX_LENGTH = 480;

function buildTemplates(fullName: string, requestId: string, route: string) {
  return [
    {
      id: "quote",
      label: "Fare quote",
      text: `Hi ${fullName},

Thank you for your ticket request (${requestId}). We've found options for your ${route} trip:

Option 1: [Airline / route / price]
Option 2: [Airline / route / price]

Please let us know which option you'd like. You can pay at our East Legon office or via mobile money.

Travel Zone Ghana`,
    },
    {
      id: "follow-up",
      label: "Need more info",
      text: `Hi ${fullName},

Thanks for your ticket request (${requestId}) for ${route}. To search the best fares, could you confirm:

- Preferred departure time
- Any airline preference
- Baggage requirements

Travel Zone Ghana`,
    },
    {
      id: "confirmed",
      label: "Ticket issued",
      text: `Hi ${fullName},

Your ticket for ${route} has been issued.

Reference: ${requestId}

Please visit our East Legon office to collect details or check your email for the e-ticket.

Safe travels!
Travel Zone Ghana`,
    },
  ] as const;
}

export function TicketRequestReplyForm({
  requestId,
  fullName,
  recipientEmail,
  recipientPhone,
  origin,
  destination,
  status,
  emailReady,
  smsReady,
}: Props) {
  const route = `${origin} → ${destination}`;
  const templates = useMemo(
    () => buildTemplates(fullName, requestId, route),
    [fullName, requestId, route],
  );
  const [reply, setReply] = useState("");
  const [state, formAction, pending] = useActionState(replyTicketRequestAction, undefined);

  const whatsAppMessage = `Hi ${fullName}, regarding your ticket request ${requestId} (${route}): `;
  const whatsAppUrl = getCustomerWhatsAppUrl(recipientPhone, whatsAppMessage);

  useAdminActionFeedback(state, pending, {
    loadingMessage: "Sending message…",
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
        to message customers from the dashboard.
      </AdminNotice>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-[#f0f0f1] pb-4">
        <a href={`tel:${recipientPhone}`} className="admin-button-secondary">
          Call customer
        </a>
        <a href={`mailto:${recipientEmail}`} className="admin-button-secondary">
          Open email
        </a>
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-button-secondary"
        >
          WhatsApp
        </a>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="requestId" value={requestId} />

        <div>
          <p className="admin-label">Message templates</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setReply(template.text)}
                className="rounded border border-[#dcdcde] bg-white px-3 py-1.5 text-xs font-semibold text-[#1d2327] hover:border-[#2271b1] hover:text-[#2271b1]"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="ticket-reply-body" className="admin-label">
            Message to customer
          </label>
          <textarea
            id="ticket-reply-body"
            name="reply"
            rows={8}
            required
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Write your quote, follow-up, or confirmation…"
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

        {status === "pending" ? (
          <label className="flex items-start gap-2 text-sm text-[#1d2327]">
            <input
              type="checkbox"
              name="markQuoted"
              defaultChecked
              className="mt-1"
            />
            Mark request as quoted after sending
          </label>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-[#f0f0f1] pt-3">
          {emailReady ? (
            <button
              type="submit"
              name="channel"
              value="email"
              disabled={pending || !reply.trim()}
              className="admin-login-submit sm:w-auto"
            >
              {pending ? "Sending…" : "Send email"}
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
              {pending ? "Sending…" : "Send SMS"}
            </button>
          ) : (
            <p className="admin-field-hint m-0">SMS unavailable — enable SplitSMS in Settings.</p>
          )}
        </div>
      </form>
    </div>
  );
}
