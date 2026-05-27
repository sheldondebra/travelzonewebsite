import { listPosStaff } from "@/server/services/pos/cashier";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const staff = await listPosStaff(businessId);
    return apiSuccess(
      staff.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        hasPin: !!u.posPinHash,
      })),
      "POS staff fetched",
    );
  });
}
