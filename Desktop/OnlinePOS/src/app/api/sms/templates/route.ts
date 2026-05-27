import { z } from "zod";
import {
  listBusinessSmsTemplates,
  resetBusinessSmsTemplate,
  upsertBusinessSmsTemplate,
} from "@/server/services/sms/sms-template-service";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const templates = await listBusinessSmsTemplates(businessId);
    return apiSuccess(templates);
  });
}

const upsertSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  isActive: z.boolean().optional(),
});

export async function PUT(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const body = await parseJsonBody(request);
      const input = upsertSchema.parse(body);
      const row = await upsertBusinessSmsTemplate(businessId, input);
      return apiSuccess(row, "Template saved");
    } catch (e) {
      return handleApiError(e);
    }
  });
}

const resetSchema = z.object({
  key: z.string().min(1),
});

export async function DELETE(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const body = await parseJsonBody(request);
      const { key } = resetSchema.parse(body);
      await resetBusinessSmsTemplate(businessId, key);
      return apiSuccess(null, "Template reset to default");
    } catch (e) {
      return handleApiError(e);
    }
  });
}
