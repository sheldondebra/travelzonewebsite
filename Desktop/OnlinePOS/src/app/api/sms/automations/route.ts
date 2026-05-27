import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SMS_AUTOMATION_KEYS } from "@/lib/sms/automation-keys";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";

const patchSchema = z.object({
  key: z.enum(SMS_AUTOMATION_KEYS),
  enabled: z.boolean(),
});

export async function PATCH(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const { key, enabled } = patchSchema.parse(body);

    const row = await prisma.smsAutomationSetting.upsert({
      where: { businessId_key: { businessId, key } },
      create: { businessId, key, enabled },
      update: { enabled },
    });

    return apiSuccess(row);
  });
}
