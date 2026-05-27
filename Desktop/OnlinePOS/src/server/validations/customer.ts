import { z } from "zod";

export const CUSTOMER_TAGS = [
  "VIP",
  "Wholesale",
  "Frequent Buyer",
  "New Customer",
  "High Spender",
] as const;

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  enableLogin: z.boolean().optional(),
  portalPassword: z.string().min(8).optional(),
});

export const importCustomersSchema = z.object({
  rows: z.array(
    z.object({
      name: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().optional(),
      tags: z.string().optional(),
    }),
  ),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  addresses: z
    .array(
      z.object({
        label: z.string(),
        line1: z.string(),
        city: z.string().optional(),
      }),
    )
    .optional(),
});

export const sendCustomerSmsSchema = z.object({
  message: z.string().min(1).max(480),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
