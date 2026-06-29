import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingTableError } from "@/lib/supabase/db-errors";
import type {
  AdminSettingsView,
  ConsultationAvailabilitySettings,
  NotificationSettings,
  PaystackSettings,
  ResendSettings,
  SiteSettings,
  SplitSmsSettings,
  SmtpSettings,
} from "@/lib/settings-types";
import type { EmailDeliveryConfig } from "@/lib/email-delivery";
import {
  DEFAULT_CONSULTATION_AVAILABILITY,
  normalizeConsultationAvailability,
} from "@/lib/consultation-availability";

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  paystack: {
    enabled: true,
    secretKey: "",
    publicKey: "",
  },
  splitsms: {
    enabled: true,
    apiKey: "",
    senderId: "TravelZone",
    adminPhones: "",
    baseUrl: "https://www.splitsms.com",
  },
  smtp: {
    enabled: false,
    host: "",
    port: 587,
    secure: false,
    user: "",
    password: "",
    fromEmail: "",
    fromName: "Travel Zone Ghana",
  },
  resend: {
    enabled: false,
    apiKey: "",
    fromEmail: "",
    fromName: "Travel Zone Ghana",
  },
  notifications: {
    emailOnBookingPaid: true,
    emailOnBookingPaidTo: "",
    emailCustomerOnBookingPaid: true,
    smsOnBookingPaid: true,
    smsCustomerOnBookingPaid: true,
    smsAdminOnBookingPaid: true,
    emailOnNewsletterSignup: false,
    emailOnNewsletterSignupTo: "",
    emailOnConsultationRequest: true,
    emailCustomerOnConsultationRequest: true,
    emailOnContactMessage: true,
    emailCustomerOnContactMessage: true,
  },
  consultationAvailability: DEFAULT_CONSULTATION_AVAILABILITY,
};

function settingsFromEnv(): Partial<SiteSettings> {
  return {
    paystack: {
      enabled: Boolean(process.env.PAYSTACK_SECRET_KEY?.trim()),
      secretKey: process.env.PAYSTACK_SECRET_KEY?.trim() ?? "",
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() ?? "",
    },
    splitsms: {
      enabled: Boolean(process.env.SPLITSMS_API_KEY?.trim()),
      apiKey: process.env.SPLITSMS_API_KEY?.trim() ?? "",
      senderId: process.env.SPLITSMS_SENDER_ID?.trim() || "TravelZone",
      adminPhones: process.env.SPLITSMS_ADMIN_PHONES?.trim() ?? "",
      baseUrl: process.env.SPLITSMS_BASE_URL?.trim() || "https://www.splitsms.com",
    },
    resend: {
      enabled: Boolean(process.env.RESEND_API_KEY?.trim()),
      apiKey: process.env.RESEND_API_KEY?.trim() ?? "",
      fromEmail: process.env.RESEND_FROM_EMAIL?.trim() ?? "",
      fromName: process.env.RESEND_FROM_NAME?.trim() || "Travel Zone Ghana",
    },
  };
}

function deepMergeSettings(base: SiteSettings, patch: Partial<SiteSettings>): SiteSettings {
  return {
    paystack: { ...base.paystack, ...patch.paystack },
    splitsms: { ...base.splitsms, ...patch.splitsms },
    smtp: { ...base.smtp, ...patch.smtp },
    resend: { ...base.resend, ...patch.resend },
    notifications: { ...base.notifications, ...patch.notifications },
    consultationAvailability: normalizeConsultationAvailability(
      patch.consultationAvailability ?? base.consultationAvailability,
    ),
  };
}

async function loadRawSettingsRow(): Promise<{
  data: Partial<SiteSettings> | null;
  revision: string;
}> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("data, updated_at")
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) return { data: null, revision: "none" };
      throw new Error(error.message);
    }

    if (!data?.data || typeof data.data !== "object") {
      return { data: null, revision: data?.updated_at ?? "none" };
    }

    return {
      data: data.data as Partial<SiteSettings>,
      revision: data.updated_at ?? "none",
    };
  } catch {
    return { data: null, revision: "none" };
  }
}

async function loadRawSettingsFromDb(): Promise<Partial<SiteSettings> | null> {
  const { data } = await loadRawSettingsRow();
  return data;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const fromEnv = settingsFromEnv();
  const fromDb = await loadRawSettingsFromDb();
  return deepMergeSettings(
    deepMergeSettings(DEFAULT_SITE_SETTINGS, fromEnv),
    fromDb ?? {},
  );
}

function isPaystackReady(settings: SiteSettings) {
  return (
    settings.paystack.enabled &&
    Boolean(settings.paystack.secretKey.trim()) &&
    Boolean(settings.paystack.publicKey.trim())
  );
}

function isSplitSmsReady(settings: SiteSettings) {
  return settings.splitsms.enabled && Boolean(settings.splitsms.apiKey.trim());
}

function isSmtpReady(settings: SiteSettings) {
  if (!settings.smtp.enabled) return false;
  if (!settings.smtp.host.trim() || !settings.smtp.fromEmail.trim()) return false;
  if (settings.smtp.user.trim() && !settings.smtp.password.trim()) return false;
  return true;
}

function isResendReady(settings: SiteSettings) {
  return (
    settings.resend.enabled &&
    Boolean(settings.resend.apiKey.trim()) &&
    Boolean(settings.resend.fromEmail.trim())
  );
}

function isEmailReady(settings: SiteSettings) {
  return isResendReady(settings) || isSmtpReady(settings);
}

export async function isPaystackConfiguredAsync() {
  const settings = await getSiteSettings();
  return isPaystackReady(settings);
}

export function isPaystackConfiguredSync() {
  return Boolean(
    process.env.PAYSTACK_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim(),
  );
}

export async function getAdminSettingsView(): Promise<AdminSettingsView> {
  const fromEnv = settingsFromEnv();
  const { data: fromDb, revision } = await loadRawSettingsRow();
  const settings = deepMergeSettings(
    deepMergeSettings(DEFAULT_SITE_SETTINGS, fromEnv),
    fromDb ?? {},
  );

  return {
    paystack: {
      ...settings.paystack,
      secretKey: "",
      hasSecretKey: Boolean(settings.paystack.secretKey),
    },
    splitsms: {
      ...settings.splitsms,
      apiKey: "",
      hasApiKey: Boolean(settings.splitsms.apiKey),
    },
    smtp: {
      ...settings.smtp,
      password: "",
      hasPassword: Boolean(settings.smtp.password),
    },
    resend: {
      ...settings.resend,
      apiKey: "",
      hasApiKey: Boolean(settings.resend.apiKey),
    },
    notifications: settings.notifications,
    status: {
      paystackReady: isPaystackReady(settings),
      splitsmsReady: isSplitSmsReady(settings),
      smtpReady: isSmtpReady(settings),
      resendReady: isResendReady(settings),
      emailReady: isEmailReady(settings),
    },
    revision,
  };
}

async function persistSettings(settings: SiteSettings, userId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      id: "default",
      data: settings,
      updated_by: userId,
    },
    { onConflict: "id" },
  );

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error(
        "Settings table is missing. Run supabase/setup-all.sql in the Supabase SQL Editor.",
      );
    }
    throw new Error(error.message);
  }
}

function preserveSecret(incoming: string, existing: string) {
  return incoming.trim() ? incoming.trim() : existing;
}

export async function savePaystackSettings(
  input: PaystackSettings,
  userId: string,
): Promise<void> {
  const current = await getSiteSettings();
  const next: SiteSettings = {
    ...current,
    paystack: {
      enabled: input.enabled,
      secretKey: preserveSecret(input.secretKey, current.paystack.secretKey),
      publicKey: input.publicKey.trim(),
    },
  };
  await persistSettings(next, userId);
}

export async function saveSplitSmsSettings(
  input: SplitSmsSettings,
  userId: string,
): Promise<void> {
  const current = await getSiteSettings();
  const next: SiteSettings = {
    ...current,
    splitsms: {
      enabled: input.enabled,
      apiKey: preserveSecret(input.apiKey, current.splitsms.apiKey),
      senderId: input.senderId.trim().slice(0, 11) || "TravelZone",
      adminPhones: input.adminPhones.trim(),
      baseUrl: input.baseUrl.trim() || "https://www.splitsms.com",
    },
  };
  await persistSettings(next, userId);
}

export async function saveSmtpSettings(input: SmtpSettings, userId: string): Promise<void> {
  const current = await getSiteSettings();
  const port = Number(input.port) || 587;
  const next: SiteSettings = {
    ...current,
    smtp: {
      enabled: input.enabled,
      host: input.host.trim(),
      port,
      secure: input.secure || port === 465,
      user: input.user.trim(),
      password: preserveSecret(input.password, current.smtp.password),
      fromEmail: input.fromEmail.trim(),
      fromName: input.fromName.trim() || "Travel Zone Ghana",
    },
  };
  await persistSettings(next, userId);
}

export async function saveResendSettings(input: ResendSettings, userId: string): Promise<void> {
  const current = await getSiteSettings();
  const next: SiteSettings = {
    ...current,
    resend: {
      enabled: input.enabled,
      apiKey: preserveSecret(input.apiKey, current.resend.apiKey),
      fromEmail: input.fromEmail.trim(),
      fromName: input.fromName.trim() || "Travel Zone Ghana",
    },
  };
  await persistSettings(next, userId);
}

export async function saveNotificationSettings(
  input: NotificationSettings,
  userId: string,
): Promise<void> {
  const current = await getSiteSettings();
  const next: SiteSettings = {
    ...current,
    notifications: {
      emailOnBookingPaid: input.emailOnBookingPaid,
      emailOnBookingPaidTo: input.emailOnBookingPaidTo.trim(),
      emailCustomerOnBookingPaid: input.emailCustomerOnBookingPaid,
      smsOnBookingPaid: input.smsOnBookingPaid,
      smsCustomerOnBookingPaid: input.smsCustomerOnBookingPaid,
      smsAdminOnBookingPaid: input.smsAdminOnBookingPaid,
      emailOnNewsletterSignup: input.emailOnNewsletterSignup,
      emailOnNewsletterSignupTo: input.emailOnNewsletterSignupTo.trim(),
      emailOnConsultationRequest: input.emailOnConsultationRequest,
      emailCustomerOnConsultationRequest: input.emailCustomerOnConsultationRequest,
      emailOnContactMessage: input.emailOnContactMessage,
      emailCustomerOnContactMessage: input.emailCustomerOnContactMessage,
    },
  };
  await persistSettings(next, userId);
}

export async function getPaystackSecretKey() {
  const settings = await getSiteSettings();
  if (!settings.paystack.enabled) return null;
  const key = settings.paystack.secretKey.trim();
  return key || null;
}

export async function getSplitSmsConfig() {
  const settings = await getSiteSettings();
  if (!settings.splitsms.enabled) return null;
  const apiKey = settings.splitsms.apiKey.trim();
  if (!apiKey) return null;
  return settings.splitsms;
}

export async function getSmtpConfig() {
  const settings = await getSiteSettings();
  if (!isSmtpReady(settings)) return null;
  return settings.smtp;
}

export async function getResendConfig() {
  const settings = await getSiteSettings();
  if (!isResendReady(settings)) return null;
  return settings.resend;
}

export async function getEmailDeliveryConfig(): Promise<EmailDeliveryConfig | null> {
  const settings = await getSiteSettings();
  if (isResendReady(settings)) {
    return { provider: "resend", config: settings.resend };
  }
  if (isSmtpReady(settings)) {
    return { provider: "smtp", config: settings.smtp };
  }
  return null;
}

export async function isEmailConfigured() {
  const settings = await getSiteSettings();
  return isEmailReady(settings);
}

export async function getNotificationSettings() {
  const settings = await getSiteSettings();
  return settings.notifications;
}

export async function getConsultationAvailability(): Promise<ConsultationAvailabilitySettings> {
  const settings = await getSiteSettings();
  return normalizeConsultationAvailability(settings.consultationAvailability);
}

export async function saveConsultationAvailabilitySettings(
  input: ConsultationAvailabilitySettings,
  userId: string,
): Promise<void> {
  const current = await getSiteSettings();
  const next: SiteSettings = {
    ...current,
    consultationAvailability: normalizeConsultationAvailability(input),
  };
  await persistSettings(next, userId);
}
