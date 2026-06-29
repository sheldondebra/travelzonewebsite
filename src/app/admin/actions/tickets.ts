"use server";

import { revalidatePath } from "next/cache";
import { sendTicketRequestReplyEmail } from "@/lib/email";
import type { TicketRequestStatus } from "@/lib/ticket-requests";
import {
  getTicketRequestById,
  updateTicketRequestStatus,
} from "@/lib/ticket-requests-store";
import { getEmailDeliveryConfig, getSplitSmsConfig } from "@/lib/site-settings";
import { sendSms } from "@/lib/splitsms";
import { requireAdmin, requireStaff } from "@/lib/supabase/auth";

export type TicketRequestActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

const SMS_MAX_LENGTH = 480;

export async function updateTicketRequestStatusAction(
  id: string,
  status: TicketRequestStatus,
): Promise<TicketRequestActionResult> {
  await requireAdmin();

  try {
    await updateTicketRequestStatus(id, status);
    revalidatePath("/admin/tickets");
    revalidatePath(`/admin/tickets/${id}`);
    return { success: true, message: "Ticket request updated." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

export async function replyTicketRequestAction(
  _prev: TicketRequestActionResult | undefined,
  formData: FormData,
): Promise<TicketRequestActionResult> {
  await requireStaff();

  const requestId = String(formData.get("requestId") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();
  const reply = String(formData.get("reply") ?? "").trim();
  const markQuoted = formData.get("markQuoted") === "on";

  if (!requestId) {
    return { success: false, error: "Ticket request not found." };
  }

  if (!reply) {
    return { success: false, error: "Write a message first." };
  }

  if (reply.length > 5000) {
    return { success: false, error: "Message is too long." };
  }

  if (channel !== "email" && channel !== "sms") {
    return { success: false, error: "Choose email or SMS." };
  }

  const request = await getTicketRequestById(requestId);
  if (!request) {
    return { success: false, error: "Ticket request not found." };
  }

  try {
    if (channel === "email") {
      const delivery = await getEmailDeliveryConfig();
      if (!delivery) {
        return {
          success: false,
          error: "Email is not configured. Set up Resend or SMTP under Admin → Settings → Email.",
        };
      }

      await sendTicketRequestReplyEmail({ request, reply });
    } else {
      if (reply.length > SMS_MAX_LENGTH) {
        return {
          success: false,
          error: `SMS messages must be ${SMS_MAX_LENGTH} characters or fewer.`,
        };
      }

      const sms = await getSplitSmsConfig();
      if (!sms) {
        return {
          success: false,
          error: "SplitSMS is not configured. Enable it under Admin → Settings.",
        };
      }

      await sendSms({
        to: request.phone,
        message: `TravelZone: ${reply} (Ref ${request.id})`,
      });
    }

    if (markQuoted && request.status === "pending") {
      await updateTicketRequestStatus(requestId, "quoted");
    }

    revalidatePath("/admin/tickets");
    revalidatePath(`/admin/tickets/${requestId}`);

    return {
      success: true,
      message: channel === "email" ? "Email sent to customer." : "SMS sent to customer.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not send message.",
    };
  }
}
