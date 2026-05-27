import type { BusinessSettings } from "@/lib/settings/defaults";

/** Strip SMS provider credentials from settings returned to tenant clients. */
export function sanitizeSettingsForTenant(
  settings: BusinessSettings,
): BusinessSettings {
  const out = structuredClone(settings);
  delete (out as { sms?: unknown }).sms;
  return out;
}

/** Remove tenant-controlled SMS provider fields from settings patches. */
export function stripTenantProviderSettingsPatch(
  patch: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!patch) return patch;
  const next = { ...patch };
  delete next.sms;
  return next;
}
