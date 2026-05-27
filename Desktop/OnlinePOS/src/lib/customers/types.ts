import type { DeliveryDetails } from "@/lib/orders/delivery";

export type CustomerAddress = {
  label: string;
  line1: string;
  city?: string;
};

export type CustomerOrderItem = {
  id: string;
  quantity: number;
  price: number;
  lineTotal: number | null;
  lineLabel: string | null;
  product: { name: string; sku: string | null; imageUrl: string | null };
  variant: { name: string } | null;
};

export type CustomerOrderSummary = {
  id: string;
  reference: string | null;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: string;
  deliveryStatus: string;
  paymentMethod: string | null;
  createdAt: string;
  items: CustomerOrderItem[];
  delivery: DeliveryDetails;
};

export type CustomerDetailPayload = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  tags: string[];
  balance: number;
  createdAt: string;
  userId: string | null;
  user?: { id: string; email: string } | null;
  addresses: CustomerAddress[];
  orders: CustomerOrderSummary[];
  stats: {
    totalOrders: number;
    totalSpending: number;
    totalAmountPaid: number;
    totalOutstanding: number;
    lastPurchase: string | null;
    pendingPayments: number;
    favoriteProducts: { name: string; quantity: number }[];
  };
  deliveryAddresses: { label: string; address: string; source: "profile" | "order" }[];
};
