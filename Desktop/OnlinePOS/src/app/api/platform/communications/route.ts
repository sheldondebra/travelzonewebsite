import {
  getPlatformOfficeConfigMasked,
  getPlatformOfficeConfigRaw,
  isPlatformConfigured,
  propagatePlatformConfigToTenants,
  savePlatformOfficeConfig,
} from "@/server/services/platform/platform-office-store";
import type { PlatformOfficeConfig } from "@/lib/platform/notification-config";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { UnauthorizedError } from "@/server/utils/errors";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

async function requirePlatformAdmin() {
  const session = await getServerSession(authOptions);
  const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (
    session?.user?.role === "PLATFORM_ADMIN" ||
    (session?.user?.email && adminEmails.includes(session.user.email))
  ) {
    return session;
  }
  throw new UnauthorizedError("Platform admin access required");
}

export async function GET() {
  try {
    await requirePlatformAdmin();
    const { office, config, configured } = await getPlatformOfficeConfigMasked();
    const raw = await getPlatformOfficeConfigRaw();

    return apiSuccess(
      {
        office: { id: office.id, name: office.name, slug: office.slug },
        config,
        status: {
          configured,
          smsReady:
            raw.sms.enabled &&
            Boolean(
              (raw.sms.hubtelClientId && raw.sms.hubtelClientSecret) ||
                raw.sms.apiKey,
            ),
          mailReady:
            raw.mail.enabled &&
            Boolean(raw.mail.resendApiKey || (raw.mail.smtpHost && raw.mail.fromEmail)),
          inheritToAllTenants: raw.inheritToAllTenants,
        },
      },
      "General Office communications config",
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requirePlatformAdmin();
    const body = (await request.json()) as Partial<PlatformOfficeConfig> & {
      propagate?: boolean;
    };

    const { propagate, ...patch } = body;
    const saved = await savePlatformOfficeConfig(patch);
    let propagation = { updated: 0 };
    if (propagate !== false && saved.inheritToAllTenants) {
      propagation = await propagatePlatformConfigToTenants(saved);
    }

    const { config, configured } = await getPlatformOfficeConfigMasked();

    return apiSuccess(
      {
        config,
        configured,
        propagation,
      },
      "General Office settings saved",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
