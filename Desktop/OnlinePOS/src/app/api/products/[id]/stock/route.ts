import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import {
  adjustProductStock,
  getStockHistory,
} from "@/server/services/stock/adjust-stock";
import { adjustStockSchema } from "@/server/validations/import";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { parseJsonBody, withBusinessAuth } from "@/server/utils/with-auth";
import { NotFoundError } from "@/server/utils/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const stocks = await prisma.productStock.findMany({
      where: { productId: id, product: { businessId } },
      include: { warehouse: true, variant: true },
    });
    const history = searchParams.get("history")
      ? await getStockHistory(businessId, id)
      : undefined;
    return apiSuccess({ stocks, history }, "Stock loaded");
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    try {
      const session = await getServerSession(authOptions);
      const body = await parseJsonBody(request);
      const input = adjustStockSchema.parse(body);
      const result = await adjustProductStock(
        businessId,
        id,
        input,
        session?.user?.id,
      );
      return apiSuccess(result, "Stock updated");
    } catch (error) {
      return handleApiError(error);
    }
  });
}
