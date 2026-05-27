import {
  deleteHeldSale,
  holdSale,
  listHeldSales,
} from "@/server/services/pos/held-sales";
import { resolvePosCashierId } from "@/server/services/pos/cashier";
import { apiSuccess } from "@/server/utils/api-response";
import {
  withBusinessAuth,
  withBusinessUserAuth,
  parseJsonBody,
} from "@/server/utils/with-auth";
import { holdSaleSchema } from "@/server/validations/pos";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const held = await listHeldSales(businessId);
    return apiSuccess(held, "Held sales fetched");
  });
}

export async function POST(request: Request) {
  return withBusinessUserAuth(request, async ({ businessId, userId }) => {
    const body = await parseJsonBody(request);
    const input = holdSaleSchema.parse(body);
    const cashierId = await resolvePosCashierId(
      request,
      businessId,
      userId,
      input.cashierToken,
    );
    const held = await holdSale(businessId, cashierId, input);
    return apiSuccess(held, "Sale held", 201);
  });
}

export async function DELETE(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) throw new Error("Missing held sale id");
    const result = await deleteHeldSale(businessId, id);
    return apiSuccess(result, "Held sale removed");
  });
}
