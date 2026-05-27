import {
  createPurchaseOrder,
  listPurchaseOrders,
  listPurchaseOrdersPaginated,
} from "@/server/services/purchase-order/create-purchase-order";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import {
  parsePaginationQuery,
  wantsPagination,
} from "@/server/validations/pagination";
import { z } from "zod";

const poSchema = z.object({
  supplierId: z.string().min(1),
  reference: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantityOrdered: z.number().int().positive(),
        unitCost: z.number().nonnegative(),
      }),
    )
    .min(1),
});

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);

    if (wantsPagination(searchParams)) {
      const { page, pageSize } = parsePaginationQuery(searchParams);
      const result = await listPurchaseOrdersPaginated(businessId, {
        page,
        pageSize,
      });
      return apiSuccess(result, "Purchase orders fetched");
    }

    const orders = await listPurchaseOrders(businessId);
    return apiSuccess(orders, "Purchase orders fetched");
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const input = poSchema.parse(body);
    const po = await createPurchaseOrder(businessId, input);
    return apiSuccess(po, "Purchase order created", 201);
  });
}
