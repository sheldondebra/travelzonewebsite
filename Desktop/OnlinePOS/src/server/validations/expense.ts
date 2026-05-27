import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "Transport",
  "Packaging",
  "Delivery",
  "Ads",
  "Supplies",
  "Miscellaneous",
] as const;

export const createExpenseSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  category: z.enum(EXPENSE_CATEGORIES),
  date: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
