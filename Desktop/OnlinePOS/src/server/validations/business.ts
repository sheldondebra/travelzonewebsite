import { z } from "zod";

export const createBusinessSchema = z.object({
  name: z.string().min(1),
});

export const updateBusinessSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  themeColor: z.string().optional(),
  currency: z.string().min(1).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  receiptFooter: z.string().optional(),
  lowStockThreshold: z.number().int().positive().optional(),
  isPublic: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  badges: z.array(z.string()).optional(),
  subscriptionPlan: z.enum(["FREE", "PRO", "BUSINESS", "ENTERPRISE"]).optional(),
  dashboardLayout: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
