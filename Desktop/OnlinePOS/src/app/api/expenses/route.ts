import { createExpense } from "@/server/services/expense/create-expense";
import {
  listExpenses,
  listExpensesPaginated,
} from "@/server/services/expense/list-expenses";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import {
  parsePaginationQuery,
  wantsPagination,
} from "@/server/validations/pagination";
import { createExpenseSchema } from "@/server/validations/expense";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const range = {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    };
    const category = searchParams.get("category") ?? undefined;

    if (wantsPagination(searchParams)) {
      const { page, pageSize } = parsePaginationQuery(searchParams);
      const result = await listExpensesPaginated(businessId, {
        ...range,
        category,
        page,
        pageSize,
      });
      return apiSuccess(result, "Expenses fetched successfully");
    }

    const expenses = await listExpenses(businessId, range);
    return apiSuccess(expenses, "Expenses fetched successfully");
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const input = createExpenseSchema.parse(body);
    const expense = await createExpense(businessId, input);
    return apiSuccess(expense, "Expense recorded", 201);
  });
}
