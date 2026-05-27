import { prisma } from "@/lib/prisma";
import type { orderFiltersSchema } from "@/server/validations/order";
import type { z } from "zod";

type OrderFilters = z.infer<typeof orderFiltersSchema>;

function buildWhere(businessId: string, filters?: OrderFilters) {
  const search = filters?.search?.trim();

  return {
    businessId,
    ...(filters?.paymentStatus
      ? { paymentStatus: filters.paymentStatus }
      : {}),
    ...(filters?.deliveryStatus
      ? { deliveryStatus: filters.deliveryStatus }
      : {}),
    ...(filters?.from || filters?.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { customer: { name: { contains: search, mode: "insensitive" as const } } },
            { notes: { contains: search, mode: "insensitive" as const } },
            { momoReference: { contains: search, mode: "insensitive" as const } },
            { reference: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

export async function listOrders(businessId: string, filters?: OrderFilters) {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 10;
  const where = buildWhere(businessId, filters);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        customer: true,
        items: { include: { product: true } },
        statusHistory: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
