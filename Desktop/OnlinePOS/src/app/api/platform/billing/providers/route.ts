import { z } from "zod";
import { BillingProvider } from "@/generated/prisma/client";
import { maskSecret } from "@/lib/platform/secrets";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";
import { parseJsonBody } from "@/server/utils/with-auth";
import {
  listBillingProviderConfigs,
  saveBillingProviderConfig,
} from "@/server/services/billing/billing-service";

const patchSchema = z.object({
  provider: z.enum(BillingProvider),
  enabled: z.boolean().optional(),
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  testMode: z.boolean().optional(),
  supportedCurrencies: z.array(z.string()).optional(),
  defaultForCurrencies: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    await requirePlatformAdmin();
    const providers = await listBillingProviderConfigs(true);
    return apiSuccess(providers, "Billing providers loaded");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requirePlatformAdmin();
    const input = patchSchema.parse(await parseJsonBody(request));
    const saved = await saveBillingProviderConfig(input.provider, input);
    return apiSuccess(
      {
        ...saved,
        secretKey: maskSecret(saved.secretKey),
        webhookSecret: maskSecret(saved.webhookSecret),
      },
      "Billing provider saved",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
