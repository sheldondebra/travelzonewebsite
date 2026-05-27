import { mergeSettings, type BusinessSettings } from "@/lib/settings/defaults";
import {
  applyPlatformOfficeToTenantSettings,
  type PlatformOfficeConfig,
  type PlatformOfficeMailConfig,
  type PlatformOfficeSmsConfig,
} from "@/lib/platform/notification-config";
import { getPlatformOfficeConfigRaw } from "@/server/services/platform/platform-office-store";
import { getBusinessSettings } from "@/server/services/settings/business-settings";

export type ResolvedNotificationSettings = {
  settings: BusinessSettings;
  platformActive: boolean;
  platformSms: PlatformOfficeSmsConfig | null;
  platformMail: PlatformOfficeMailConfig | null;
};

export async function resolveNotificationSettings(
  businessId: string,
): Promise<ResolvedNotificationSettings> {
  const row = await getBusinessSettings(businessId);
  if (!row) {
    return {
      settings: mergeSettings(null),
      platformActive: false,
      platformSms: null,
      platformMail: null,
    };
  }

  let settings = row.settings;
  let platformActive = false;
  let platformSms: PlatformOfficeSmsConfig | null = null;
  let platformMail: PlatformOfficeMailConfig | null = null;

  try {
    const platform: PlatformOfficeConfig = await getPlatformOfficeConfigRaw();
    if (platform.inheritToAllTenants) {
      settings = applyPlatformOfficeToTenantSettings(settings, platform);
      platformActive = true;
      platformSms = platform.sms;
      platformMail = platform.mail;
    }
  } catch {
    // General Office not seeded — tenant-only config
  }

  return { settings, platformActive, platformSms, platformMail };
}
