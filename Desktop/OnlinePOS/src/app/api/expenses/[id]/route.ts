import { deleteExpense } from "@/server/services/expense/delete-expense";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const result = await deleteExpense(businessId, id);
    return apiSuccess(result, "Expense deleted");
  });
}
