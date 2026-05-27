import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(5).max(100).optional().default(10),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function parsePaginationQuery(searchParams: URLSearchParams): PaginationQuery {
  return paginationQuerySchema.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });
}

export function wantsPagination(searchParams: URLSearchParams): boolean {
  return searchParams.has("page");
}
