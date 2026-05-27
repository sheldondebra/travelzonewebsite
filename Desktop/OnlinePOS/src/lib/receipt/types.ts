import type { BusinessSettings } from "@/lib/settings/defaults";

export type ReceiptLine = {
  label: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ReceiptTotals = {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  amountPaid: number;
  changeDue: number;
};

export type ReceiptModel = {
  orderId: string;
  orderRef: string;
  createdAt: Date;
  paymentStatus: string;
  deliveryStatus: string;
  paymentMethod: string | null;
  momoReference: string | null;
  momoNetwork: string | null;
  notes: string | null;
  business: {
    name: string;
    logoUrl: string | null;
    currency: string;
    receiptFooter: string | null;
  };
  customer: {
    name: string;
    phone: string | null;
    email: string | null;
  };
  lines: ReceiptLine[];
  totals: ReceiptTotals;
  config: BusinessSettings["posReceipt"];
};

export type ReceiptDeliveryResult = {
  sms: { attempted: boolean; sent: boolean; error?: string };
  email: { attempted: boolean; sent: boolean; error?: string };
};
