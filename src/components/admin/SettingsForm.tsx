"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useActionState, useState, type ReactNode } from "react";
import {
  saveNotificationSettingsAction,
  savePaystackSettingsAction,
  saveResendSettingsAction,
  saveSmtpSettingsAction,
  saveSplitSmsSettingsAction,
  testSplitSmsAction,
  testSmtpAction,
} from "@/app/admin/actions/settings";
import { AdminNotice, AdminWidget } from "@/components/admin/AdminChrome";
import { useAdminActionFeedback } from "@/components/admin/AdminToastProvider";
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

const tabs: { id: Tab; label: string; readyKey?: keyof AdminSettingsView["status"] }[] = [
  { id: "paystack", label: "Paystack", readyKey: "paystackReady" },
  { id: "splitsms", label: "SplitSMS", readyKey: "splitsmsReady" },
  { id: "smtp", label: "Email", readyKey: "emailReady" },
  { id: "notifications", label: "Notifications" },
];

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
    <label htmlFor={id} className="admin-settings-toggle">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#2271b1]"
      />
      <span>
        <span className="block text-[13px] font-semibold text-[#1d2327]">{label}</span>
        {description ? (
          <span className="admin-field-hint mt-0.5 block">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

function CopyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <span className="admin-label">{label}</span>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input readOnly value={value} className="admin-input min-w-0 flex-1 font-mono text-[12px]" />
        <button type="button" onClick={copy} className="admin-button-secondary shrink-0">
          {copied ? "Copied" : "Copy URL"}
        </button>
      </div>
      {hint ? <p className="admin-field-hint">{hint}</p> : null}
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="admin-settings-group">
      <p className="admin-settings-group-title">{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FormFooter({
  pending,
  label,
  disabled,
}: {
  pending: boolean;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="admin-settings-form-footer">
      <button type="submit" disabled={pending || disabled} className="admin-login-submit sm:w-auto">
        {pending ? "Saving…" : label}
      </button>
    </div>
  );
}

function PaystackPanel({
  settings,
  webhookUrl,
  revision,
}: {
  settings: AdminSettingsView;
  webhookUrl: string;
  revision: string;
}) {
  const [state, action, pending] = useActionState(savePaystackSettingsAction, undefined);
  useAdminActionFeedback(state, pending, { loadingMessage: "Saving Paystack settings…" });

  return (
    <AdminWidget title="Paystack payments">
      <p className="admin-field-hint mt-0">
        Accept card and mobile money payments for tour bookings.
      </p>

      <form key={`paystack-${revision}`} action={action} className="mt-4 space-y-4">
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

        <CopyField
          label="Webhook URL"
          value={webhookUrl}
          hint="Add this URL in your Paystack dashboard under Settings → Webhooks."
        />

        <FormFooter pending={pending} label="Save Paystack settings" />
      </form>
    </AdminWidget>
  );
}

function SplitSmsPanel({
  settings,
  splitSmsBalance,
  splitSmsBalanceError,
  revision,
}: {
  settings: AdminSettingsView;
  splitSmsBalance: SplitSmsBalance | null;
  splitSmsBalanceError: string | null;
  revision: string;
}) {
  const [saveState, saveAction, savePending] = useActionState(
    saveSplitSmsSettingsAction,
    undefined,
  );
  const [testState, testAction, testPending] = useActionState(testSplitSmsAction, undefined);
  useAdminActionFeedback(saveState, savePending, { loadingMessage: "Saving SplitSMS settings…" });
  useAdminActionFeedback(testState, testPending, {
    loadingMessage: "Sending test SMS…",
    refresh: false,
  });

  return (
    <AdminWidget title="SplitSMS">
      <p className="admin-field-hint mt-0">
        Send SMS confirmations to customers and alerts to your team after payment.
      </p>

      {settings.status.splitsmsReady ? (
        <div className="mt-4">
          <SplitSmsBalancePanel
            initialBalance={splitSmsBalance}
            initialError={splitSmsBalanceError}
          />
        </div>
      ) : (
        <AdminNotice variant="warning">
          Add your API key below to connect SplitSMS and view your balance.
        </AdminNotice>
      )}

      <form key={`splitsms-${revision}`} action={saveAction} className="mt-4 space-y-4">
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

        <div className="admin-form-grid-2">
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
          <p className="admin-field-hint">
            Comma-separated Ghana numbers. Used for new booking SMS alerts.
          </p>
        </div>

        <FormFooter pending={savePending} label="Save SplitSMS settings" />
      </form>

      <form
        key={`splitsms-test-${revision}`}
        action={testAction}
        className="admin-settings-test-form"
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="splitsms-test-phone" className="admin-label">
            Send test SMS
          </label>
          <input
            id="splitsms-test-phone"
            name="testPhone"
            type="text"
            placeholder="233244274663"
            className="admin-input"
            disabled={!settings.status.splitsmsReady}
          />
        </div>
        <button
          type="submit"
          disabled={testPending || !settings.status.splitsmsReady}
          className="admin-button-secondary shrink-0"
        >
          {testPending ? "Sending…" : "Send test"}
        </button>
      </form>
    </AdminWidget>
  );
}

function EmailPanel({ settings, revision }: { settings: AdminSettingsView; revision: string }) {
  const [smtpSaveState, smtpSaveAction, smtpSavePending] = useActionState(
    saveSmtpSettingsAction,
    undefined,
  );
  const [resendSaveState, resendSaveAction, resendSavePending] = useActionState(
    saveResendSettingsAction,
    undefined,
  );
  const [testState, testAction, testPending] = useActionState(testSmtpAction, undefined);
  useAdminActionFeedback(smtpSaveState, smtpSavePending, {
    loadingMessage: "Saving SMTP settings…",
  });
  useAdminActionFeedback(resendSaveState, resendSavePending, {
    loadingMessage: "Saving Resend settings…",
  });
  useAdminActionFeedback(testState, testPending, {
    loadingMessage: "Sending test email…",
    refresh: false,
  });

  return (
    <div className="space-y-4">
      <AdminWidget title="Resend (recommended on Render)">
        <p className="admin-field-hint mt-0">
          Uses HTTPS instead of SMTP ports. Required on Render free web services, which block
          outbound SMTP on ports 25, 465, and 587. Resend is tried first when enabled.
        </p>

        <form key={`resend-${revision}`} action={resendSaveAction} className="mt-4 space-y-4">
          <Toggle
            id="resend-enabled"
            name="enabled"
            label="Enable Resend"
            defaultChecked={settings.resend.enabled}
          />

          <div>
            <label htmlFor="resend-api-key" className="admin-label">
              API key
            </label>
            <input
              id="resend-api-key"
              name="apiKey"
              type="password"
              autoComplete="off"
              placeholder={
                settings.resend.hasApiKey
                  ? "Saved — leave blank to keep current"
                  : "re_xxxxxxxx"
              }
              className="admin-input max-w-md"
            />
            <p className="admin-field-hint">
              Create a key at{" "}
              <a href="https://resend.com/api-keys" target="_blank" className="text-[#2271b1]">
                resend.com/api-keys
              </a>
              . Verify your sending domain in Resend before going live.
            </p>
          </div>

          <div className="admin-form-grid-2">
            <div>
              <label htmlFor="resend-from-email" className="admin-label">
                From email
              </label>
              <input
                id="resend-from-email"
                name="fromEmail"
                type="email"
                defaultValue={settings.resend.fromEmail}
                placeholder="hello@travelzonegh.com"
                className="admin-input"
              />
            </div>
            <div>
              <label htmlFor="resend-from-name" className="admin-label">
                From name
              </label>
              <input
                id="resend-from-name"
                name="fromName"
                type="text"
                defaultValue={settings.resend.fromName}
                className="admin-input"
              />
            </div>
          </div>

          <FormFooter pending={resendSavePending} label="Save Resend settings" />
        </form>
      </AdminWidget>

      <AdminWidget title="SMTP (local or paid hosting)">
        <p className="admin-field-hint mt-0">
          Direct SMTP works on localhost and paid Render instances. On Render free tier, SMTP
          connections time out — use Resend above instead.
        </p>

        <form key={`smtp-${revision}`} action={smtpSaveAction} className="mt-4 space-y-4">
        <Toggle
          id="smtp-enabled"
          name="enabled"
          label="Enable SMTP"
          defaultChecked={settings.smtp.enabled}
        />

        <div className="admin-form-grid-2">
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

        <div className="admin-form-grid-2">
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

        <div className="admin-form-grid-2">
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

        <FormFooter pending={smtpSavePending} label="Save SMTP settings" />
      </form>

      <form key={`email-test-${revision}`} action={testAction} className="admin-settings-test-form">
        <div className="min-w-0 flex-1">
          <label htmlFor="smtp-test-email" className="admin-label">
            Send test email
          </label>
          <input
            id="smtp-test-email"
            name="testEmail"
            type="email"
            placeholder="you@example.com"
            className="admin-input"
            disabled={!settings.status.emailReady}
          />
        </div>
        <button
          type="submit"
          disabled={testPending || !settings.status.emailReady}
          className="admin-button-secondary shrink-0"
        >
          {testPending ? "Sending…" : "Send test"}
        </button>
      </form>
      </AdminWidget>
    </div>
  );
}

function NotificationsPanel({
  settings,
  revision,
}: {
  settings: AdminSettingsView;
  revision: string;
}) {
  const [state, action, pending] = useActionState(saveNotificationSettingsAction, undefined);
  useAdminActionFeedback(state, pending, { loadingMessage: "Saving notification settings…" });

  return (
    <AdminWidget title="Notifications">
      <p className="admin-field-hint mt-0">
        Choose which alerts fire when bookings are paid or forms are submitted.
      </p>

      <form key={`notifications-${revision}`} action={action} className="mt-4 space-y-4">
        <SettingsGroup title="After successful payment">
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
            <p className="admin-field-hint">
              Used for paid bookings, consultation requests, and contact form alerts.
              Falls back to the office email if left blank.
            </p>
          </div>
        </SettingsGroup>

        <SettingsGroup title="Consultation requests">
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
        </SettingsGroup>

        <SettingsGroup title="Contact form messages">
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
        </SettingsGroup>

        <SettingsGroup title="Newsletter sign-ups">
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
        </SettingsGroup>

        <FormFooter pending={pending} label="Save notification settings" />
      </form>
    </AdminWidget>
  );
}

export function SettingsForm({
  settings,
  webhookUrl,
  splitSmsBalance = null,
  splitSmsBalanceError = null,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: Tab =
    tabParam === "splitsms" ||
    tabParam === "smtp" ||
    tabParam === "notifications" ||
    tabParam === "paystack"
      ? tabParam
      : "paystack";

  function setTab(next: Tab) {
    router.replace(`/admin/settings?tab=${next}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <div className="admin-tours-stats admin-settings-stats">
        <div className="admin-tours-stat">
          <span
            className={`admin-tours-stat-value ${
              settings.status.paystackReady ? "text-[#007017]" : "text-[#646970]"
            }`}
          >
            {settings.status.paystackReady ? "Ready" : "Setup"}
          </span>
          <span className="admin-tours-stat-label">Paystack</span>
        </div>
        <div className="admin-tours-stat">
          <span
            className={`admin-tours-stat-value ${
              settings.status.splitsmsReady ? "text-[#007017]" : "text-[#646970]"
            }`}
          >
            {settings.status.splitsmsReady ? "Ready" : "Setup"}
          </span>
          <span className="admin-tours-stat-label">SplitSMS</span>
        </div>
        <div className="admin-tours-stat">
          <span
            className={`admin-tours-stat-value ${
              settings.status.emailReady ? "text-[#007017]" : "text-[#646970]"
            }`}
          >
            {settings.status.emailReady ? "Ready" : "Setup"}
          </span>
          <span className="admin-tours-stat-label">
            Email{settings.status.resendReady ? " · Resend" : settings.status.smtpReady ? " · SMTP" : ""}
          </span>
        </div>
      </div>

      <div className="admin-settings-layout">
        <nav className="admin-settings-nav" aria-label="Settings sections">
          <ul className="admin-settings-nav-list">
            {tabs.map((item) => {
              const ready =
                item.readyKey != null ? settings.status[item.readyKey] : null;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`admin-settings-nav-link${
                      tab === item.id ? " admin-settings-nav-link-active" : ""
                    }`}
                    aria-current={tab === item.id ? "page" : undefined}
                  >
                    <span>{item.label}</span>
                    {ready != null ? (
                      <span
                        className={`admin-settings-nav-dot${
                          ready ? " admin-settings-nav-dot-ready" : ""
                        }`}
                        aria-label={ready ? "Configured" : "Not configured"}
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="admin-settings-panel">
          {tab === "paystack" ? (
            <PaystackPanel
              settings={settings}
              webhookUrl={webhookUrl}
              revision={settings.revision}
            />
          ) : null}

          {tab === "splitsms" ? (
            <SplitSmsPanel
              settings={settings}
              splitSmsBalance={splitSmsBalance}
              splitSmsBalanceError={splitSmsBalanceError ?? null}
              revision={settings.revision}
            />
          ) : null}

          {tab === "smtp" ? (
            <EmailPanel settings={settings} revision={settings.revision} />
          ) : null}

          {tab === "notifications" ? (
            <NotificationsPanel settings={settings} revision={settings.revision} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
