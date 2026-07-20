"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Globe,
  Lock,
  Mail,
  Palette,
  Save,
  Send,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/auth-errors";
import {
  fetchAdminSettings,
  testAdminEmail,
  testAdminPaystack,
  updateAdminSettings,
  type AdminSettingsResponse,
  type SettingsGroup,
} from "@/services/admin-settings";

const SECRET_MASK = "••••••••";
const PAYSTACK_KEY_FIELDS = new Set(["paystack_public_key", "paystack_secret_key"]);

type Tab = {
  id: SettingsGroup;
  label: string;
  icon: typeof Settings;
  description: string;
};

const TABS: Tab[] = [
  {
    id: "branding",
    label: "Site & Branding",
    icon: Palette,
    description: "Site name, logo, colors, and support contact.",
  },
  {
    id: "email",
    label: "Email Setup",
    icon: Mail,
    description: "SMTP and sender configuration for notifications.",
  },
  {
    id: "email_templates",
    label: "Email Templates",
    icon: Send,
    description: "Customize notification subject lines and message bodies.",
  },
  {
    id: "paystack",
    label: "Paystack & Payments",
    icon: CreditCard,
    description: "Paystack keys, currency, and checkout fees.",
  },
  {
    id: "security",
    label: "Session & Security",
    icon: Shield,
    description: "Session lifetime, verification, and password rules.",
  },
];

const FIELD_LABELS: Record<string, string> = {
  site_name: "Site name",
  site_tagline: "Tagline",
  logo_url: "Logo URL",
  primary_color: "Primary color",
  support_email: "Support email",
  frontend_url: "Frontend URL",
  mail_mailer: "Mail driver",
  mail_host: "SMTP host",
  mail_port: "SMTP port",
  mail_username: "SMTP username",
  mail_password: "SMTP password",
  mail_encryption: "Encryption",
  mail_from_address: "From address",
  mail_from_name: "From name",
  tpl_welcome_subject: "Welcome email subject",
  tpl_welcome_body: "Welcome email body",
  tpl_password_reset_subject: "Password reset subject",
  tpl_password_reset_body: "Password reset body",
  tpl_enrollment_subject: "Enrollment subject",
  tpl_enrollment_body: "Enrollment body",
  tpl_announcement_subject_prefix: "Announcement subject prefix",
  paystack_enabled: "Enable Paystack",
  paystack_public_key: "Public key",
  paystack_secret_key: "Secret key",
  paystack_currency: "Currency",
  payment_processing_fee: "Processing fee (GHS)",
  session_lifetime: "Session lifetime (minutes)",
  require_email_verification: "Require email verification",
  max_login_attempts: "Max login attempts",
  password_min_length: "Minimum password length",
  sanctum_expiration: "API token expiration (minutes)",
};

const BOOLEAN_FIELDS = new Set(["paystack_enabled", "require_email_verification"]);
const TEXTAREA_FIELDS = new Set([
  "tpl_welcome_body",
  "tpl_password_reset_body",
  "tpl_enrollment_body",
]);

function fieldLabel(key: string) {
  return FIELD_LABELS[key] ?? key.replace(/_/g, " ");
}

export function AdminSettingsView() {
  const [data, setData] = useState<AdminSettingsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsGroup>("branding");
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingPaystack, setTestingPaystack] = useState(false);

  const activeTabMeta = useMemo(() => TABS.find((t) => t.id === activeTab)!, [activeTab]);

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminSettings()
      .then((res) => {
        setData(res);
        const current = res.groups[activeTab] ?? {};
        setForm(Object.fromEntries(Object.entries(current).map(([k, v]) => [k, v.value])));
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load settings."));
      })
      .finally(() => setLoading(false));
  }, [activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  function switchTab(tab: SettingsGroup) {
    setActiveTab(tab);
    if (data?.groups[tab]) {
      setForm(Object.fromEntries(Object.entries(data.groups[tab]).map(([k, v]) => [k, v.value])));
    }
  }

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await updateAdminSettings(activeTab, form);
      toast.success(res.message);
      setData((prev) => (prev ? { ...prev, groups: res.groups } : prev));
      const refreshed = res.groups[activeTab] ?? {};
      setForm(Object.fromEntries(Object.entries(refreshed).map(([k, v]) => [k, v.value])));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save settings."));
    } finally {
      setSaving(false);
    }
  }

  async function handleTestEmail() {
    setTestingEmail(true);
    try {
      await updateAdminSettings("email", form);
      const res = await testAdminEmail();
      toast.success(res.message);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Test email failed."));
    } finally {
      setTestingEmail(false);
    }
  }

  async function handleTestPaystack() {
    setTestingPaystack(true);
    try {
      await updateAdminSettings("paystack", form);
      const res = await testAdminPaystack();
      toast.success(res.message);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Paystack verification failed."));
    } finally {
      setTestingPaystack(false);
    }
  }

  function renderField(key: string, field: { is_secret: boolean }) {
    const label = fieldLabel(key);
    const value = form[key] ?? "";

    if (BOOLEAN_FIELDS.has(key)) {
      return (
        <label key={key} className="flex items-center justify-between gap-4 rounded-[10px] border border-[#E5EAF2] px-4 py-3">
          <div>
            <p className="text-[13px] font-medium text-[#002B7F]">{label}</p>
          </div>
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => updateField(key, e.target.checked ? "true" : "false")}
            className="h-4 w-4 rounded border-[#D1D5DB] text-[#0057FF]"
          />
        </label>
      );
    }

    if (key === "mail_mailer") {
      return (
        <div key={key}>
          <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">{label}</label>
          <select className="ed-input w-full" value={value} onChange={(e) => updateField(key, e.target.value)}>
            <option value="log">Log (development)</option>
            <option value="smtp">SMTP</option>
          </select>
        </div>
      );
    }

    if (key === "mail_encryption") {
      return (
        <div key={key}>
          <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">{label}</label>
          <select className="ed-input w-full" value={value} onChange={(e) => updateField(key, e.target.value)}>
            <option value="">None</option>
            <option value="tls">TLS</option>
            <option value="ssl">SSL</option>
          </select>
        </div>
      );
    }

    if (key === "primary_color") {
      return (
        <div key={key}>
          <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">{label}</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={value || "#0057FF"}
              onChange={(e) => updateField(key, e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-[#E5EAF2] bg-white p-1"
            />
            <input className="ed-input flex-1" value={value} onChange={(e) => updateField(key, e.target.value)} />
          </div>
        </div>
      );
    }

    if (TEXTAREA_FIELDS.has(key)) {
      return (
        <div key={key}>
          <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">{label}</label>
          <textarea
            className="ed-input min-h-[100px] w-full resize-y py-2 font-mono text-[12px]"
            value={value}
            onChange={(e) => updateField(key, e.target.value)}
          />
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            Placeholders: {"{name}"}, {"{site_name}"}, {"{course_name}"}
          </p>
        </div>
      );
    }

    const inputType =
      field.is_secret || PAYSTACK_KEY_FIELDS.has(key)
        ? "password"
        : key.includes("email")
          ? "email"
          : key.includes("url")
            ? "url"
            : "text";

    return (
      <div key={key}>
        <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">{label}</label>
        <input
          type={inputType}
          className="ed-input w-full"
          value={value}
          placeholder={
            (field.is_secret || PAYSTACK_KEY_FIELDS.has(key)) && value === SECRET_MASK
              ? "Leave unchanged or enter new value"
              : PAYSTACK_KEY_FIELDS.has(key)
                ? "pk_test_... or pk_live_..."
                : undefined
          }
          onChange={(e) => updateField(key, e.target.value)}
        />
        {field.is_secret || PAYSTACK_KEY_FIELDS.has(key) ? (
          <p className="mt-1 text-[11px] text-[#9CA3AF]">
            {PAYSTACK_KEY_FIELDS.has(key)
              ? "Key is masked for security. Leave blank to keep the current value."
              : "Leave blank to keep the current secret."}
          </p>
        ) : null}
      </div>
    );
  }

  const fields = data?.groups[activeTab] ?? {};

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#002B7F]">Settings</h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          Platform configuration — branding, email, Paystack, templates, and security.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="ed-card p-2">
          <ul className="space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => switchTab(id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${
                    activeTab === id
                      ? "bg-[#EBF2FF] font-semibold text-[#0057FF]"
                      : "text-[#374151] hover:bg-[#F7F9FC]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ed-card p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[#E5EAF2] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <activeTabMeta.icon className="h-5 w-5 text-[#0057FF]" strokeWidth={1.75} />
                <h2 className="text-[17px] font-bold text-[#002B7F]">{activeTabMeta.label}</h2>
              </div>
              <p className="mt-1 text-[12px] text-[#6B7280]">{activeTabMeta.description}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || loading}
              className="ed-btn-primary gap-2 text-[13px]"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>

          {loading ? (
            <p className="text-[13px] text-[#6B7280]">Loading settings...</p>
          ) : (
            <div className="space-y-4">
              {activeTab === "branding" ? (
                <div className="mb-2 flex items-center gap-3 rounded-[10px] bg-[#F7F9FC] p-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: form.primary_color || "#0057FF" }}
                  >
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-[#002B7F]">{form.site_name || "Site name"}</p>
                    <p className="text-[12px] text-[#6B7280]">{form.site_tagline || "Tagline preview"}</p>
                  </div>
                </div>
              ) : null}

              {activeTab === "email_templates" ? (
                <p className="rounded-[10px] bg-[#FFFBEB] px-3 py-2 text-[12px] text-[#92400E]">
                  Templates support placeholders like {"{name}"}, {"{site_name}"}, and {"{course_name}"}.
                </p>
              ) : null}

              {activeTab === "paystack" ? (
                <div className="flex flex-wrap gap-2 rounded-[10px] bg-[#F7F9FC] p-4 text-[12px] text-[#6B7280]">
                  <span className="inline-flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-[#0057FF]" />
                    Checkout uses Paystack when enabled
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-[#0057FF]" />
                    Secret keys are stored securely and never shown in full
                  </span>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(fields).map(([key, field]) => (
                  <div key={key} className={TEXTAREA_FIELDS.has(key) ? "sm:col-span-2" : ""}>
                    {renderField(key, field)}
                  </div>
                ))}
              </div>

              {activeTab === "email" ? (
                <div className="flex flex-wrap gap-2 border-t border-[#E5EAF2] pt-4">
                  <button
                    type="button"
                    onClick={() => void handleTestEmail()}
                    disabled={testingEmail || saving}
                    className="ed-btn-outline gap-2 text-[13px]"
                  >
                    <Mail className="h-4 w-4" />
                    {testingEmail ? "Sending..." : "Send test email"}
                  </button>
                </div>
              ) : null}

              {activeTab === "paystack" ? (
                <div className="flex flex-wrap gap-2 border-t border-[#E5EAF2] pt-4">
                  <button
                    type="button"
                    onClick={() => void handleTestPaystack()}
                    disabled={testingPaystack || saving}
                    className="ed-btn-outline gap-2 text-[13px]"
                  >
                    <CreditCard className="h-4 w-4" />
                    {testingPaystack ? "Verifying..." : "Verify Paystack keys"}
                  </button>
                </div>
              ) : null}

              {activeTab === "security" ? (
                <p className="border-t border-[#E5EAF2] pt-4 text-[11px] text-[#9CA3AF]">
                  Session and password rules apply to new logins. Changes to session lifetime may require users to sign in again.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
