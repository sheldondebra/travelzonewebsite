import { z } from "zod";

export const verifyCashierPinSchema = z.object({
  pin: z.string().min(4).max(6),
});

export const setCashierPinSchema = z.object({
  userId: z.string().min(1),
  pin: z.string().min(4).max(6).nullable(),
});
