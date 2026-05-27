import { paginatedResult, type Paginated } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/server/utils/errors";
import type { TaskStatus, TaskType } from "@/generated/prisma/enums";

export async function createTask(
  businessId: string,
  data: {
    title: string;
    description?: string;
    type?: TaskType;
    dueDate?: Date;
    assigneeId?: string;
  },
) {
  return prisma.task.create({
    data: { ...data, businessId },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });
}

export async function listTasks(businessId: string, status?: TaskStatus) {
  const where = {
    businessId,
    ...(status ? { status } : {}),
  };

  return prisma.task.findMany({
    where,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: { assignee: { select: { id: true, name: true } } },
  });
}

export async function listTasksPaginated(
  businessId: string,
  opts: { status?: TaskStatus; page: number; pageSize: number },
): Promise<Paginated<Awaited<ReturnType<typeof listTasks>>[number]>> {
  const where = {
    businessId,
    ...(opts.status ? { status: opts.status } : {}),
  };
  const { page, pageSize } = opts;

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { assignee: { select: { id: true, name: true } } },
    }),
  ]);

  return paginatedResult(tasks, total, page, pageSize);
}

export async function updateTask(
  businessId: string,
  taskId: string,
  data: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    assigneeId: string | null;
  }>,
) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, businessId },
  });
  if (!task) throw new NotFoundError("Task not found");

  return prisma.task.update({
    where: { id: taskId },
    data,
    include: { assignee: { select: { id: true, name: true } } },
  });
}
