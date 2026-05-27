import type { BusinessSettings } from "@/lib/settings/defaults";
import { HubtelSmsProvider } from "@/server/services/sms/providers/hubtel-provider";
import { SplitSmsProvider } from "@/server/services/sms/providers/splitsms-provider";
import type { SmsProvider } from "@/server/services/sms/providers/types";
import { prisma } from "@/lib/prisma";

export async function getActiveSmsProvider(
  fallbackSms?: BusinessSettings["sms"],
): Promise<{ provider: SmsProvider; providerName: string; fallbackSenderId?: string }> {
  const config = await prisma.smsProviderConfig.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (config) {
    if (config.provider === "SPLITSMS") {
      return {
        provider: new SplitSmsProvider({
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          username: config.username,
          password: config.password,
        }),
        providerName: "SPLITSMS",
        fallbackSenderId: config.senderId ?? undefined,
      };
    }
  }

  if (fallbackSms?.enabled) {
    return {
      provider: new HubtelSmsProvider(fallbackSms),
      providerName: "HUBTEL",
      fallbackSenderId: fallbackSms.senderId || undefined,
    };
  }

  throw new Error("No SMS provider configured. Set up SplitSMS in General Office or enable Hubtel in settings.");
}
