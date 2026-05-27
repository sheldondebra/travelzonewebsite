import {
  ensureSmsWallet,
  getSmsWalletBalance,
  isAutomationEnabled,
  seedDefaultSmsTemplates,
} from "@/server/services/sms/sms-service";
import { prisma } from "@/lib/prisma";
import { SMS_AUTOMATION_KEYS, SMS_AUTOMATION_LABELS } from "@/lib/sms/automation-keys";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    await seedDefaultSmsTemplates();

    const [balance, senderId, automations] = await Promise.all([
      getSmsWalletBalance(businessId),
      prisma.businessSenderId.findFirst({
        where: { businessId },
        orderBy: { createdAt: "desc" },
      }),
      Promise.all(
        SMS_AUTOMATION_KEYS.map(async (key) => ({
          key,
          label: SMS_AUTOMATION_LABELS[key],
          enabled: await isAutomationEnabled(businessId, key),
        })),
      ),
    ]);

    await ensureSmsWallet(businessId);

    return apiSuccess({
      balance,
      lowBalance: balance <= 20,
      senderId: senderId
        ? {
            id: senderId.id,
            senderId: senderId.senderId,
            status: senderId.status,
            reason: senderId.reason,
            createdAt: senderId.createdAt.toISOString(),
          }
        : null,
      automations,
    });
  });
}
