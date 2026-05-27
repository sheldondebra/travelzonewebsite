import { getBusinessReports } from "@/server/services/reports/get-business-reports";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const data = await getBusinessReports(
      businessId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
    return apiSuccess(data, "Reports generated");
  });
}
