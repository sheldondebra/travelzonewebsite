import {
  createTask,
  listTasks,
  listTasksPaginated,
} from "@/server/services/task/task-service";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import {
  parsePaginationQuery,
  wantsPagination,
} from "@/server/validations/pagination";
import type { TaskStatus } from "@/generated/prisma/enums";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["PACKING", "DELIVERY", "INVENTORY", "FOLLOW_UP", "GENERAL"]).optional(),
  dueDate: z.coerce.date().optional(),
  assigneeId: z.string().optional(),
});

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as TaskStatus | null;

    if (wantsPagination(searchParams)) {
      const { page, pageSize } = parsePaginationQuery(searchParams);
      const result = await listTasksPaginated(businessId, {
        status: status ?? undefined,
        page,
        pageSize,
      });
      return apiSuccess(result, "Tasks fetched");
    }

    const tasks = await listTasks(businessId, status ?? undefined);
    return apiSuccess(tasks, "Tasks fetched");
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const input = taskSchema.parse(body);
    const task = await createTask(businessId, input);
    return apiSuccess(task, "Task created", 201);
  });
}
