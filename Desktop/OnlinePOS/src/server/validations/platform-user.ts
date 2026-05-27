import { z } from "zod";

const userRoleEnum = z.enum([
  "OWNER",
  "MANAGER",
  "STAFF",
  "DELIVERY",
  "CUSTOMER",
  "PLATFORM_ADMIN",
]);

export const listPlatformUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  role: userRoleEnum.optional(),
  businessId: z.string().optional(),
  suspended: z
    .enum(["true", "false", "all"])
    .optional()
    .default("all"),
  emailVerified: z.enum(["true", "false", "all"]).optional().default("all"),
});

export const createPlatformUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
  role: userRoleEnum.default("STAFF"),
  businessId: z.string().nullable().optional(),
  emailVerified: z.boolean().optional(),
});

export const updatePlatformUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).nullable().optional(),
  role: userRoleEnum.optional(),
  businessId: z.string().nullable().optional(),
  emailVerified: z.boolean().optional(),
});

export const resetPlatformUserPasswordSchema = z.object({
  password: z.string().min(8),
});

export const suspendPlatformUserSchema = z.object({
  suspended: z.boolean(),
  reason: z.string().optional(),
});

export type ListPlatformUsersInput = z.infer<typeof listPlatformUsersSchema>;
export type CreatePlatformUserInput = z.infer<typeof createPlatformUserSchema>;
export type UpdatePlatformUserInput = z.infer<typeof updatePlatformUserSchema>;
