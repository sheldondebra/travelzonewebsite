import { z } from "zod";
import { maskSecret } from "@/lib/platform/secrets";
import {
  getSmsPaymentConfig,
  saveSmsPaymentConfig,
} from "@/lib/platform/sms-payments";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";
import { parseJsonBody } from "@/server/utils/with-auth";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const config = await getSmsPaymentConfig();
    return apiSuccess({
      ...config,
      secretKey: maskSecret(config.secretKey),
      webhookSecret: maskSecret(config.webhookSecret),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

const saveSchema = z.object({
  enabled: z.boolean().optional(),
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  testMode: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    await requirePlatformAdmin();
    const body = await parseJsonBody(request);
    const input = saveSchema.parse(body);
    const saved = await saveSmsPaymentConfig(input);
    return apiSuccess(
      {
        ...saved,
        secretKey: maskSecret(saved.secretKey),
        webhookSecret: maskSecret(saved.webhookSecret),
      },
      "SMS payment settings saved",
    );
  } catch (e) {
    return handleApiError(e);
  }
}
