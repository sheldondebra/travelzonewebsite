import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { runDatabaseImport } from "@/server/services/import/run-import";
import { importRunSchema } from "@/server/validations/import";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const session = await getServerSession(authOptions);
      const body = await parseJsonBody(request);
      const input = importRunSchema.parse(body);
      const result = await runDatabaseImport(
        businessId,
        input.sessionId,
        {
          mode: input.mode,
          updateExisting: input.updateExisting,
          skipDuplicates: input.skipDuplicates,
          stopOnError: input.stopOnError,
        },
        session?.user?.id,
      );
      return apiSuccess(result, "Import completed");
    } catch (error) {
      return handleApiError(error);
    }
  });
}
