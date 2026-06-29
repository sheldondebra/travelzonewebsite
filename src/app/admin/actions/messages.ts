"use server";

import { revalidatePath } from "next/cache";
import type { ContactMessageStatus } from "@/lib/contact-messages";
import { sendContactMessageReplyEmail } from "@/lib/email";
import {
  getContactMessageById,
  updateContactMessageStatus,
} from "@/lib/contact-messages-store";
import { sendSms } from "@/lib/splitsms";
import { getEmailDeliveryConfig, getSplitSmsConfig } from "@/lib/site-settings";
import { requireAdmin, requireStaff } from "@/lib/supabase/auth";

export type MessageReplyResult =
  | { success: true; message: string }
  | { success: false; error: string };

const SMS_MAX_LENGTH = 480;

export async function updateContactMessageStatusAction(
  id: string,
  status: ContactMessageStatus,
) {
  await requireAdmin();

  try {
    await updateContactMessageStatus(id, status);
    revalidatePath("/admin/messages");
    revalidatePath(`/admin/messages/${id}`);
    return { success: true as const, message: "Message status updated." };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

export async function replyContactMessageAction(
  _prev: MessageReplyResult | undefined,
  formData: FormData,
): Promise<MessageReplyResult> {
  await requireStaff();

  const messageId = String(formData.get("messageId") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();
  const reply = String(formData.get("reply") ?? "").trim();

  if (!messageId) {
    return { success: false, error: "Message not found." };
  }

  if (!reply) {
    return { success: false, error: "Write a reply first." };
  }

  if (reply.length > 5000) {
    return { success: false, error: "Reply is too long." };
  }

  if (channel !== "email" && channel !== "sms") {
    return { success: false, error: "Choose email or SMS." };
  }

  const message = await getContactMessageById(messageId);
  if (!message) {
    return { success: false, error: "Message not found." };
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

      await sendContactMessageReplyEmail({ message, reply });
    } else {
      if (reply.length > SMS_MAX_LENGTH) {
        return {
          success: false,
          error: `SMS replies must be ${SMS_MAX_LENGTH} characters or fewer.`,
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
        to: message.phone,
        message: `TravelZone: ${reply} (Ref ${message.id})`,
      });
    }

    if (message.status === "pending") {
      await updateContactMessageStatus(messageId, "read");
    }

    revalidatePath("/admin/messages");
    revalidatePath(`/admin/messages/${messageId}`);

    return {
      success: true,
      message: channel === "email" ? "Email reply sent." : "SMS reply sent.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not send reply.",
    };
  }
}
