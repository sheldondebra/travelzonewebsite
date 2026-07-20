import api, { prepareApiRequest } from "@/lib/api";

export type SettingsGroup =
  | "branding"
  | "email"
  | "email_templates"
  | "paystack"
  | "security";

export type SettingField = {
  value: string;
  is_secret: boolean;
  has_value: boolean;
};

export type AdminSettingsResponse = {
  groups: Record<SettingsGroup, Record<string, SettingField>>;
  meta: {
    group_labels: Record<SettingsGroup, string>;
  };
};

export async function fetchAdminSettings() {
  const { data } = await api.get<AdminSettingsResponse>("/admin/settings");
  return data;
}

export async function updateAdminSettings(group: SettingsGroup, settings: Record<string, string>) {
  await prepareApiRequest();
  const { data } = await api.patch<{ message: string; groups: AdminSettingsResponse["groups"] }>(
    "/admin/settings",
    { group, settings },
  );
  return data;
}

export async function testAdminEmail() {
  await prepareApiRequest();
  const { data } = await api.post<{ message: string }>("/admin/settings/test-email");
  return data;
}

export async function testAdminPaystack() {
  await prepareApiRequest();
  const { data } = await api.post<{ message: string }>("/admin/settings/test-paystack");
  return data;
}

export type PublicBranding = {
  site_name: string;
  site_tagline: string;
  logo_url: string;
  primary_color: string;
  support_email: string;
  paystack: {
    enabled: boolean;
    public_key: string;
    currency: string;
    processing_fee: number;
  };
};

export async function fetchPublicBranding() {
  const { data } = await api.get<PublicBranding>("/settings/branding");
  return data;
}
