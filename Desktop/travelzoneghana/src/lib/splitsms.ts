import { getSplitSmsConfig } from "@/lib/site-settings";

type SendSmsParams = {
  to: string | string[];
  message: string;
};

type SplitSmsResponse = {
  success?: boolean;
  error?: { code?: string; message?: string };
  message?: string;
};

type SplitSmsBalanceResponse = {
  success?: boolean;
  wallet?: { balance?: number; currency?: string };
  sms_credits?: number;
  sandbox?: boolean;
  error?: { code?: string; message?: string };
  message?: string;
};

export type SplitSmsBalance = {
  smsCredits: number;
  walletBalance: number;
  currency: string;
  sandbox: boolean;
};

export type SplitSmsBalanceResult =
  | { ok: true; balance: SplitSmsBalance }
  | { ok: false; error: string };

/** Normalize Ghana numbers to 233XXXXXXXXX for SplitSMS */
export function normalizeGhanaPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("233") && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `233${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `233${digits}`;
  }

  return digits;
}

export async function sendSms({ to, message }: SendSmsParams) {
  const config = await getSplitSmsConfig();
  if (!config) {
    throw new Error("SplitSMS is not configured or disabled.");
  }

  const recipients = (Array.isArray(to) ? to : [to])
    .map(normalizeGhanaPhone)
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error("No valid phone numbers for SMS.");
  }

  const response = await fetch(`${config.baseUrl}/api/v1/sms/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: config.senderId.slice(0, 11),
      recipients,
      message,
    }),
  });

  const data = (await response.json()) as SplitSmsResponse;

  if (!response.ok || data.success === false) {
    const detail =
      data.error?.message ?? data.message ?? "SplitSMS request failed.";
    throw new Error(detail);
  }

  return data;
}

export async function notifyBookingPayment(booking: {
  id: string;
  fullName: string;
  phone: string;
  tourTitle: string;
  travelDate: string;
  travelers: number;
  paidAmountGhs: number;
}) {
  const config = await getSplitSmsConfig();
  const { getNotificationSettings } = await import("@/lib/site-settings");
  const notifications = await getNotificationSettings();

  if (!config || !notifications.smsOnBookingPaid) return;

  const customerMessage = `TravelZone: Payment of GHS ${booking.paidAmountGhs.toLocaleString()} received for ${booking.tourTitle} (${booking.travelers} traveler${booking.travelers > 1 ? "s" : ""}, ${booking.travelDate}). Ref: ${booking.id}. We will confirm details shortly.`;

  const adminMessage = `New paid booking ${booking.id}: ${booking.fullName}, ${booking.tourTitle}, GHS ${booking.paidAmountGhs.toLocaleString()}, ${booking.phone}, travel ${booking.travelDate}.`;

  const adminPhones =
    config.adminPhones
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean) ?? [];

  if (notifications.smsCustomerOnBookingPaid) {
    await sendSms({ to: booking.phone, message: customerMessage });
  }

  if (notifications.smsAdminOnBookingPaid && adminPhones.length > 0) {
    await sendSms({ to: adminPhones, message: adminMessage });
  }
}

export async function sendTestSms(to: string, message: string) {
  await sendSms({ to, message });
}

export async function getSplitSmsBalance(): Promise<SplitSmsBalanceResult> {
  const config = await getSplitSmsConfig();
  if (!config) {
    return { ok: false, error: "SplitSMS is not configured or disabled." };
  }

  try {
    const response = await fetch(`${config.baseUrl}/api/v1/balance`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      cache: "no-store",
    });

    const data = (await response.json()) as SplitSmsBalanceResponse;

    if (!response.ok || data.success === false) {
      const detail =
        data.error?.message ?? data.message ?? "Could not fetch SplitSMS balance.";
      return { ok: false, error: detail };
    }

    return {
      ok: true,
      balance: {
        smsCredits: data.sms_credits ?? 0,
        walletBalance: data.wallet?.balance ?? 0,
        currency: data.wallet?.currency ?? "GHS",
        sandbox: data.sandbox ?? false,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not fetch SplitSMS balance.",
    };
  }
}
