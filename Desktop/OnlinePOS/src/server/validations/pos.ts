import { z } from "zod";
import { createOrderSchema } from "@/server/validations/order";

export const posPaymentLineSchema = z.object({
  method: z.enum(["CASH", "MOMO", "BANK_TRANSFER", "CARD"]),
  amount: z.number().positive(),
  reference: z.string().optional(),
  network: z.string().optional(),
});

export const createPosSaleSchema = createOrderSchema.extend({
  registerSessionId: z.string().optional(),
  changeDue: z.number().nonnegative().optional(),
  payments: z.array(posPaymentLineSchema).min(1).optional(),
  cashierToken: z.string().optional(),
});

export const holdSaleSchema = z.object({
  label: z.string().min(1).max(120),
  customerId: z.string().optional(),
  payload: z.record(z.string(), z.unknown()),
  cashierToken: z.string().optional(),
});

export const openRegisterSchema = z.object({
  openingFloat: z.number().nonnegative(),
  openingNote: z.string().optional(),
});

export const closeRegisterSchema = z.object({
  sessionId: z.string().min(1),
  countedCash: z.number().nonnegative(),
  closingNote: z.string().optional(),
});

export const cashMovementSchema = z.object({
  sessionId: z.string().min(1),
  type: z.enum(["CASH_IN", "CASH_OUT"]),
  amount: z.number().positive(),
  reason: z.string().min(1).max(200),
});

export const registerReportSchema = z.object({
  sessionId: z.string().min(1),
  type: z.enum(["X", "Z"]).default("X"),
});

export const refundSaleSchema = z.object({
  orderId: z.string().min(1),
  action: z.enum(["refund", "void"]).default("refund"),
  reason: z.string().optional(),
  lines: z
    .array(
      z.object({
        orderItemId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .optional(),
});

export type CreatePosSaleInput = z.infer<typeof createPosSaleSchema>;
export type HoldSaleInput = z.infer<typeof holdSaleSchema>;
export type RefundSaleInput = z.infer<typeof refundSaleSchema>;
