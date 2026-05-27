import { analyzeImportSession } from "@/server/services/import/run-import";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import { z } from "zod";

const schema = z.object({ sessionId: z.string().min(1) });

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const body = await parseJsonBody(request);
      const { sessionId } = schema.parse(body);
      const data = await analyzeImportSession(sessionId, businessId);
      return apiSuccess(data, "Import analyzed");
    } catch (error) {
      return handleApiError(error);
    }
  });
}
