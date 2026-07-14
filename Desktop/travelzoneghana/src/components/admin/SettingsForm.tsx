"use client";

import { useState, useTransition } from "react";
import {
  saveNotificationSettingsAction,
  savePaystackSettingsAction,
  saveSmtpSettingsAction,
  saveSplitSmsSettingsAction,
  testSplitSmsAction,
  testSmtpAction,
  type SettingsActionResult,
} from "@/app/admin/actions/settings";
import { SplitSmsBalancePanel } from "@/components/admin/SplitSmsBalancePanel";
import type { AdminSettingsView } from "@/lib/settings-types";
import type { SplitSmsBalance } from "@/lib/splitsms";

type Tab = "paystack" | "splitsms" | "smtp" | "notifications";

type Props = {
  settings: AdminSettingsView;
  webhookUrl: string;
  splitSmsBalance?: SplitSmsBalance | null;
  splitSmsBalanceError?: string | null;
};

function StatusPill({ ready, label }: { ready: boolean; label: string }) {
  return (
    <span
      className={`inline-flex rounded-[3px] px-1.5 py-0.5 text-[11px] font-semibold ${
        ready ? "bg-[#edfaef] text-[#007017]" : "bg-[#f0f0f1] text-[#646970]"
      }`}
    >
      {ready ? `${label} ready` : `${label} not configured`}
    </span>
  );
}

function Toggle({
  id,
  name,
  label,
  description,
  defaultChecked,
}: {
  id: string;
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 accent-[#2271b1]"
      />
      <span>
        <span className="block text-[13px] font-semibold text-[#1d2327]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[13px] text-[#646970]">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

function FormMessage({ result }: { result: SettingsActionResult | null }) {
  if (!result) return null;
  return (
    <div
      className={`admin-notice mb-4 ${
        result.success ? "admin-notice-success" : "admin-notice-error"
      }`}
    >
      {result.success ? result.message : result.error}
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-postbox">
      <div className="admin-postbox-header">
        <h2>{title}</h2>
      </div>
      <div className="admin-postbox-body space-y-5">
        <p className="text-[#646970]">{description}</p>
        {children}
      </div>
    </div>
  );
}

export function SettingsForm({
  settings,
  webhookUrl,
  splitSmsBalance = null,
  splitSmsBalanceError = null,
}: Props) {
  const [tab, setTab] = useState<Tab>("paystack");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<SettingsActionResult | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: "paystack", label: "Paystack" },
    { id: "splitsms", label: "SplitSMS" },
    { id: "smtp", label: "SMTP" },
    { id: "notifications", label: "Notifications" },
  ];

  function run(action: (formData: FormData) => Promise<SettingsActionResult>) {
    return (formData: FormData) => {
      startTransition(async () => {
        const result = await action(formData);
        setMessage(result);
      });
    };
  }

  return (
    <div className="space-y-6">
      <div className="admin-tab-bar">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setMessage(null);
            }}
            className={`admin-tab ${tab === item.id ? "admin-tab-active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill ready={settings.status.paystackReady} label="Paystack" />
        <StatusPill ready={settings.status.splitsmsReady} label="SplitSMS" />
        <StatusPill ready={settings.status.smtpReady} label="SMTP" />
      </div>

      <FormMessage result={message} />

      {tab === "paystack" ? (
        <SettingsSection
          title="Paystack payments"
          description="Accept online card and mobile money payments for tour bookings."
        >
          <form action={run(savePaystackSettingsAction)} className="space-y-5">
            <Toggle
              id="paystack-enabled"
              name="enabled"
              label="Enable Paystack"
              description="When disabled, customers cannot pay online."
              defaultChecked={settings.paystack.enabled}
            />
            <div>
              <label htmlFor="paystack-secret" className="admin-label">
                Secret key
              </label>
              <input
                id="paystack-secret"
                name="secretKey"
                type="password"
                autoComplete="off"
                placeholder={
                  settings.paystack.hasSecretKey
                    ? "Saved — leave blank to keep current"
                    : "sk_test_… or sk_live_…"
                }
                className="admin-input font-mono"
              />
            </div>
            <div>
              <label htmlFor="paystack-public" className="admin-label">
                Public key
              </label>
              <input
                id="paystack-public"
                name="publicKey"
                type="text"
                defaultValue={settings.paystack.publicKey}
                placeholder="pk_test_… or pk_live_…"
                className="admin-input font-mono"
              />
            </div>
            <p className="text-[13px] text-[#646970]">
              Webhook URL:{" "}
              <code className="bg-[#f0f0f1] px-1">{webhookUrl}</code>
            </p>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Saving…" : "Save Paystack settings"}
            </button>
          </form>
        </SettingsSection>
      ) : null}

      {tab === "splitsms" ? (
        <SettingsSection
          title="SplitSMS"
          description="Send SMS confirmations to customers and alerts to your team after payment."
        >
          {settings.status.splitsmsReady ? (
            <SplitSmsBalancePanel
              initialBalance={splitSmsBalance}
              initialError={splitSmsBalanceError}
            />
          ) : null}

          <form action={run(saveSplitSmsSettingsAction)} className="space-y-5">
            <Toggle
              id="splitsms-enabled"
              name="enabled"
              label="Enable SplitSMS"
              defaultChecked={settings.splitsms.enabled}
            />
            <div>
              <label htmlFor="splitsms-key" className="admin-label">
                API key
              </label>
              <input
                id="splitsms-key"
                name="apiKey"
                type="password"
                autoComplete="off"
                placeholder={
                  settings.splitsms.hasApiKey
                    ? "Saved — leave blank to keep current"
                    : "Your SplitSMS API key"
                }
                className="admin-input font-mono"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="splitsms-sender" className="admin-label">
                  Sender ID
                </label>
                <input
                  id="splitsms-sender"
                  name="senderId"
                  type="text"
                  maxLength={11}
                  defaultValue={settings.splitsms.senderId}
                  className="admin-input"
                />
              </div>
              <div>
                <label htmlFor="splitsms-base" className="admin-label">
                  API base URL
                </label>
                <input
                  id="splitsms-base"
                  name="baseUrl"
                  type="url"
                  defaultValue={settings.splitsms.baseUrl}
                  className="admin-input"
                />
              </div>
            </div>
            <div>
              <label htmlFor="splitsms-phones" className="admin-label">
                Admin alert phones
              </label>
              <input
                id="splitsms-phones"
                name="adminPhones"
                type="text"
                defaultValue={settings.splitsms.adminPhones}
                placeholder="233244274663, 233244963557"
                className="admin-input"
              />
              <p className="mt-1 text-xs text-text-muted">
                Comma-separated Ghana numbers. Used for new booking SMS alerts.
              </p>
            </div>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Saving…" : "Save SplitSMS settings"}
            </button>
          </form>

          <form action={run(testSplitSmsAction)} className="flex flex-wrap items-end gap-3 border-t border-parchment pt-5">
            <div className="min-w-60 flex-1">
              <label htmlFor="splitsms-test-phone" className="admin-label">
                Test SMS
              </label>
              <input
                id="splitsms-test-phone"
                name="testPhone"
                type="text"
                placeholder="233244274663"
                className="admin-input"
              />
            </div>
            <button type="submit" disabled={pending} className="btn-primary">
              Send test SMS
            </button>
          </form>
        </SettingsSection>
      ) : null}

      {tab === "smtp" ? (
        <SettingsSection
          title="SMTP email"
          description="Send booking confirmations and admin alerts by email."
        >
          <form action={run(saveSmtpSettingsAction)} className="space-y-5">
            <Toggle
              id="smtp-enabled"
              name="enabled"
              label="Enable SMTP"
              defaultChecked={settings.smtp.enabled}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="smtp-host" className="admin-label">
                  SMTP host
                </label>
                <input
                  id="smtp-host"
                  name="host"
                  type="text"
                  defaultValue={settings.smtp.host}
                  placeholder="smtp.gmail.com"
                  className="admin-input"
                />
              </div>
              <div>
                <label htmlFor="smtp-port" className="admin-label">
                  Port
                </label>
                <input
                  id="smtp-port"
                  name="port"
                  type="number"
                  defaultValue={settings.smtp.port}
                  className="admin-input"
                />
              </div>
            </div>
            <Toggle
              id="smtp-secure"
              name="secure"
              label="Use SSL/TLS (port 465)"
              defaultChecked={settings.smtp.secure}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="smtp-user" className="admin-label">
                  Username
                </label>
                <input
                  id="smtp-user"
                  name="user"
                  type="text"
                  defaultValue={settings.smtp.user}
                  className="admin-input"
                />
              </div>
              <div>
                <label htmlFor="smtp-password" className="admin-label">
                  Password
                </label>
                <input
                  id="smtp-password"
                  name="password"
                  type="password"
                  autoComplete="off"
                  placeholder={
                    settings.smtp.hasPassword
                      ? "Saved — leave blank to keep current"
                      : "SMTP password or app password"
                  }
                  className="admin-input"
                />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="smtp-from-email" className="admin-label">
                  From email
                </label>
                <input
                  id="smtp-from-email"
                  name="fromEmail"
                  type="email"
                  defaultValue={settings.smtp.fromEmail}
                  className="admin-input"
                />
              </div>
              <div>
                <label htmlFor="smtp-from-name" className="admin-label">
                  From name
                </label>
                <input
                  id="smtp-from-name"
                  name="fromName"
                  type="text"
                  defaultValue={settings.smtp.fromName}
                  className="admin-input"
                />
              </div>
            </div>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Saving…" : "Save SMTP settings"}
            </button>
          </form>

          <form action={run(testSmtpAction)} className="flex flex-wrap items-end gap-3 border-t border-parchment pt-5">
            <div className="min-w-60 flex-1">
              <label htmlFor="smtp-test-email" className="admin-label">
                Test email
              </label>
              <input
                id="smtp-test-email"
                name="testEmail"
                type="email"
                placeholder="you@example.com"
                className="admin-input"
              />
            </div>
            <button type="submit" disabled={pending} className="btn-primary">
              Send test email
            </button>
          </form>
        </SettingsSection>
      ) : null}

      {tab === "notifications" ? (
        <SettingsSection
          title="Notifications"
          description="Choose which alerts fire when bookings are paid or newsletter sign-ups happen."
        >
          <form action={run(saveNotificationSettingsAction)} className="space-y-6">
            <div className="space-y-4 rounded-xl border border-parchment bg-cream/40 p-5">
              <p className="text-sm font-semibold text-navy">After successful payment</p>
              <Toggle
                id="notif-sms"
                name="smsOnBookingPaid"
                label="Send SMS notifications"
                defaultChecked={settings.notifications.smsOnBookingPaid}
              />
              <Toggle
                id="notif-sms-customer"
                name="smsCustomerOnBookingPaid"
                label="SMS to customer"
                description="Payment confirmation sent to the phone number on the booking."
                defaultChecked={settings.notifications.smsCustomerOnBookingPaid}
              />
              <Toggle
                id="notif-sms-admin"
                name="smsAdminOnBookingPaid"
                label="SMS to admin phones"
                description="Uses admin numbers from the SplitSMS tab."
                defaultChecked={settings.notifications.smsAdminOnBookingPaid}
              />
              <Toggle
                id="notif-email"
                name="emailOnBookingPaid"
                label="Send email notifications"
                defaultChecked={settings.notifications.emailOnBookingPaid}
              />
              <Toggle
                id="notif-email-customer"
                name="emailCustomerOnBookingPaid"
                label="Email to customer"
                description="Receipt-style confirmation to the booking email address."
                defaultChecked={settings.notifications.emailCustomerOnBookingPaid}
              />
              <div>
                <label htmlFor="notif-email-admin" className="admin-label">
                  Admin inbox emails
                </label>
                <input
                  id="notif-email-admin"
                  name="emailOnBookingPaidTo"
                  type="text"
                  defaultValue={settings.notifications.emailOnBookingPaidTo}
                  placeholder="ops@travelzonegh.com, manager@travelzonegh.com"
                  className="admin-input"
                />
                <p className="mt-1 text-xs text-[#646970]">
                  Used for paid bookings, consultation requests, and contact form alerts.
                  Falls back to the office email if left blank.
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-parchment bg-cream/40 p-5">
              <p className="text-sm font-semibold text-navy">Consultation requests</p>
              <Toggle
                id="notif-consultation-admin"
                name="emailOnConsultationRequest"
                label="Email alert to admin inbox"
                defaultChecked={settings.notifications.emailOnConsultationRequest}
              />
              <Toggle
                id="notif-consultation-customer"
                name="emailCustomerOnConsultationRequest"
                label="Confirmation email to customer"
                defaultChecked={settings.notifications.emailCustomerOnConsultationRequest}
              />
            </div>

            <div className="space-y-4 rounded-xl border border-parchment bg-cream/40 p-5">
              <p className="text-sm font-semibold text-navy">Contact form messages</p>
              <Toggle
                id="notif-contact-admin"
                name="emailOnContactMessage"
                label="Email alert to admin inbox"
                defaultChecked={settings.notifications.emailOnContactMessage}
              />
              <Toggle
                id="notif-contact-customer"
                name="emailCustomerOnContactMessage"
                label="Confirmation email to customer"
                defaultChecked={settings.notifications.emailCustomerOnContactMessage}
              />
            </div>

            <div className="space-y-4 rounded-xl border border-parchment bg-cream/40 p-5">
              <p className="text-sm font-semibold text-navy">Newsletter sign-ups</p>
              <Toggle
                id="notif-newsletter"
                name="emailOnNewsletterSignup"
                label="Email alert on new subscriber"
                defaultChecked={settings.notifications.emailOnNewsletterSignup}
              />
              <div>
                <label htmlFor="notif-newsletter-to" className="admin-label">
                  Notify these emails
                </label>
                <input
                  id="notif-newsletter-to"
                  name="emailOnNewsletterSignupTo"
                  type="text"
                  defaultValue={settings.notifications.emailOnNewsletterSignupTo}
                  placeholder="marketing@travelzonegh.com"
                  className="admin-input"
                />
              </div>
            </div>

            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Saving…" : "Save notification settings"}
            </button>
          </form>
        </SettingsSection>
      ) : null}
    </div>
  );
}
