import { z } from "zod";
import { DELIVERY_STATUSES, deliveryDetailsSchema } from "@/lib/orders/delivery";

export const PAYMENT_STATUSES = [
  "paid",
  "pending",
  "partially_paid",
  "refunded",
] as const;

export const orderLineSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative().optional(),
});

export const createOrderSchema = z.object({
  customerId: z.string().min(1),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  deliveryStatus: z.enum(DELIVERY_STATUSES),
  paymentMethod: z
    .enum(["CASH", "MOMO", "BANK_TRANSFER", "CARD", "SPLIT"])
    .optional(),
  amountPaid: z.number().nonnegative().optional(),
  changeDue: z.number().nonnegative().optional(),
  momoReference: z.string().optional(),
  momoNetwork: z.string().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
  taxPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().nonnegative().optional(),
  shippingAmount: z.number().nonnegative().optional(),
  deliveryDetails: deliveryDetailsSchema.optional(),
  registerSessionId: z.string().optional(),
  payments: z
    .array(
      z.object({
        method: z.enum(["CASH", "MOMO", "BANK_TRANSFER", "CARD"]),
        amount: z.number().positive(),
        reference: z.string().optional(),
        network: z.string().optional(),
      }),
    )
    .min(1)
    .optional(),
  items: z.array(orderLineSchema).min(1),
});

export const updateOrderSchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  deliveryStatus: z.enum(DELIVERY_STATUSES).optional(),
  deliveryRequired: z.boolean().optional(),
  deliveryDetails: deliveryDetailsSchema.optional(),
  paymentMethod: z
    .enum(["CASH", "MOMO", "BANK_TRANSFER", "CARD"])
    .optional(),
  amountPaid: z.number().nonnegative().optional(),
  momoReference: z.string().optional(),
  momoNetwork: z.string().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

export const orderFiltersSchema = z.object({
  search: z.string().optional(),
  paymentStatus: z.string().optional(),
  deliveryStatus: z.enum(DELIVERY_STATUSES).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(5).max(50).optional().default(10),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
