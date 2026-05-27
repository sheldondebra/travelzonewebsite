import { apiError, apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

/** MVP placeholder — Paystack/Hubtel integration in Phase 2 */
export async function GET(request: Request) {
  return withBusinessAuth(request, async () => {
    return apiSuccess(
      { status: "not_configured", providers: ["paystack", "hubtel"] },
      "Payments module ready for integration",
    );
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async () => {
    return apiError(
      "Payment processing is not enabled yet. Coming in Phase 2.",
      501,
    );
  });
}
