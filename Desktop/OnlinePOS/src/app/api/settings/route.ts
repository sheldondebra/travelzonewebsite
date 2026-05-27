import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isPlatformAdminUser } from "@/lib/platform/is-platform-admin";
import {
  sanitizeSettingsForTenant,
  stripTenantProviderSettingsPatch,
} from "@/lib/settings/tenant-sanitize";
import {
  getBusinessSettings,
  updateBusinessSettings,
  exportSettingsBackup,
} from "@/server/services/settings/business-settings";
import { patchSettingsSchema } from "@/server/validations/settings";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { parseJsonBody } from "@/server/utils/with-auth";
import { UnauthorizedError } from "@/server/utils/errors";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) throw new UnauthorizedError();

    const data = await getBusinessSettings(session.user.businessId);
    if (!data) throw new Error("Business not found");

    const isPlatformAdmin = isPlatformAdminUser(session.user);
    const payload = isPlatformAdmin
      ? data
      : {
          ...data,
          settings: sanitizeSettingsForTenant(data.settings),
        };

    return apiSuccess(payload, "Settings loaded");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) throw new UnauthorizedError();

    const body = await parseJsonBody(request);
    const input = patchSettingsSchema.parse(body);
    const isPlatformAdmin = isPlatformAdminUser(session.user);

    const settingsPatch = isPlatformAdmin
      ? input.settings
      : stripTenantProviderSettingsPatch(
          input.settings as Record<string, unknown> | undefined,
        );

    const data = await updateBusinessSettings(session.user.businessId, {
      settings: settingsPatch as Record<string, unknown> | undefined,
      themeColor: input.themeColor,
      currency: input.currency,
      receiptFooter: input.receiptFooter,
      taxRate: input.taxRate,
    });

    return apiSuccess(data, "Settings saved");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) throw new UnauthorizedError();

    const { searchParams } = new URL(request.url);
    if (searchParams.get("action") === "backup") {
      const data = await getBusinessSettings(session.user.businessId);
      if (!data) throw new Error("Business not found");
      await updateBusinessSettings(session.user.businessId, {
        recordBackup: true,
      });
      const refreshed = await getBusinessSettings(session.user.businessId);
      return apiSuccess(
        exportSettingsBackup(refreshed?.settings ?? data.settings),
        "Backup generated",
      );
    }

    return handleApiError(new Error("Unknown action"));
  } catch (error) {
    return handleApiError(error);
  }
}
