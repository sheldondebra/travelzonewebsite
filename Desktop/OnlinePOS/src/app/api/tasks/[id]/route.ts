import { updateTask } from "@/server/services/task/task-service";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  assigneeId: z.string().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const input = updateSchema.parse(body);
    const task = await updateTask(businessId, id, input);
    return apiSuccess(task, "Task updated");
  });
}
