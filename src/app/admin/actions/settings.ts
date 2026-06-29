"use server";

import { revalidatePath } from "next/cache";
import { sendTestEmail } from "@/lib/email";
import { getSplitSmsBalance, sendTestSms, type SplitSmsBalance } from "@/lib/splitsms";
import {
  saveNotificationSettings,
  savePaystackSettings,
  saveSmtpSettings,
  saveSplitSmsSettings,
} from "@/lib/site-settings";
import { requireAdmin } from "@/lib/supabase/auth";

export type SettingsActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

function checkbox(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export async function savePaystackSettingsAction(
  _prev: SettingsActionResult | undefined,
  formData: FormData,
): Promise<SettingsActionResult> {
  try {
    const { user } = await requireAdmin();
    await savePaystackSettings(
      {
        enabled: checkbox(formData.get("enabled")),
        secretKey: String(formData.get("secretKey") ?? ""),
        publicKey: String(formData.get("publicKey") ?? ""),
      },
      user.id,
    );
    revalidatePath("/admin/settings");
    return { success: true, message: "Paystack settings saved." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save Paystack settings.",
    };
  }
}

export async function saveSplitSmsSettingsAction(
  _prev: SettingsActionResult | undefined,
  formData: FormData,
): Promise<SettingsActionResult> {
  try {
    const { user } = await requireAdmin();
    await saveSplitSmsSettings(
      {
        enabled: checkbox(formData.get("enabled")),
        apiKey: String(formData.get("apiKey") ?? ""),
        senderId: String(formData.get("senderId") ?? "TravelZone"),
        adminPhones: String(formData.get("adminPhones") ?? ""),
        baseUrl: String(formData.get("baseUrl") ?? "https://www.splitsms.com"),
      },
      user.id,
    );
    revalidatePath("/admin/settings");
    return { success: true, message: "SplitSMS settings saved." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save SplitSMS settings.",
    };
  }
}

export async function saveSmtpSettingsAction(
  _prev: SettingsActionResult | undefined,
  formData: FormData,
): Promise<SettingsActionResult> {
  try {
    const { user } = await requireAdmin();
    await saveSmtpSettings(
      {
        enabled: checkbox(formData.get("enabled")),
        host: String(formData.get("host") ?? ""),
        port: Number(formData.get("port") ?? 587),
        secure: checkbox(formData.get("secure")),
        user: String(formData.get("user") ?? ""),
        password: String(formData.get("password") ?? ""),
        fromEmail: String(formData.get("fromEmail") ?? ""),
        fromName: String(formData.get("fromName") ?? "Travel Zone Ghana"),
      },
      user.id,
    );
    revalidatePath("/admin/settings");
    return { success: true, message: "SMTP settings saved." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save SMTP settings.",
    };
  }
}

export async function saveNotificationSettingsAction(
  _prev: SettingsActionResult | undefined,
  formData: FormData,
): Promise<SettingsActionResult> {
  try {
    const { user } = await requireAdmin();
    await saveNotificationSettings(
      {
        emailOnBookingPaid: checkbox(formData.get("emailOnBookingPaid")),
        emailOnBookingPaidTo: String(formData.get("emailOnBookingPaidTo") ?? ""),
        emailCustomerOnBookingPaid: checkbox(formData.get("emailCustomerOnBookingPaid")),
        smsOnBookingPaid: checkbox(formData.get("smsOnBookingPaid")),
        smsCustomerOnBookingPaid: checkbox(formData.get("smsCustomerOnBookingPaid")),
        smsAdminOnBookingPaid: checkbox(formData.get("smsAdminOnBookingPaid")),
        emailOnNewsletterSignup: checkbox(formData.get("emailOnNewsletterSignup")),
        emailOnNewsletterSignupTo: String(formData.get("emailOnNewsletterSignupTo") ?? ""),
        emailOnConsultationRequest: checkbox(formData.get("emailOnConsultationRequest")),
        emailCustomerOnConsultationRequest: checkbox(
          formData.get("emailCustomerOnConsultationRequest"),
        ),
        emailOnContactMessage: checkbox(formData.get("emailOnContactMessage")),
        emailCustomerOnContactMessage: checkbox(
          formData.get("emailCustomerOnContactMessage"),
        ),
      },
      user.id,
    );
    revalidatePath("/admin/settings");
    return { success: true, message: "Notification settings saved." };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Could not save notification settings.",
    };
  }
}

export async function testSmtpAction(
  _prev: SettingsActionResult | undefined,
  formData: FormData,
): Promise<SettingsActionResult> {
  try {
    await requireAdmin();
    const to = String(formData.get("testEmail") ?? "").trim();
    if (!to) return { success: false, error: "Enter a test email address." };
    await sendTestEmail(to);
    return { success: true, message: `Test email sent to ${to}.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SMTP test failed.",
    };
  }
}

export type SplitSmsBalanceActionResult =
  | { success: true; balance: SplitSmsBalance }
  | { success: false; error: string };

export async function refreshSplitSmsBalanceAction(): Promise<SplitSmsBalanceActionResult> {
  try {
    await requireAdmin();
    const result = await getSplitSmsBalance();
    if (!result.ok) return { success: false, error: result.error };
    return { success: true, balance: result.balance };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not fetch SplitSMS balance.",
    };
  }
}

export async function testSplitSmsAction(
  _prev: SettingsActionResult | undefined,
  formData: FormData,
): Promise<SettingsActionResult> {
  try {
    await requireAdmin();
    const phone = String(formData.get("testPhone") ?? "").trim();
    if (!phone) return { success: false, error: "Enter a test phone number." };
    await sendTestSms(phone, "Travel Zone Ghana: SplitSMS test message from admin settings.");
    return { success: true, message: `Test SMS sent to ${phone}.` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SplitSMS test failed.",
    };
  }
}
