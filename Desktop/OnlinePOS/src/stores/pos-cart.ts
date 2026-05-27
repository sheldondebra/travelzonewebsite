import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeliveryDetails } from "@/lib/orders/delivery";

export type PosFulfillmentType = "pickup" | "delivery";

export type PosCartItem = {
  productId: string;
  variantId?: string | null;
  lineKey: string;
  name: string;
  code: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  minimumPrice: number;
  stockQuantity: number;
  imageUrl?: string | null;
};

export type PosCustomer = {
  id: string;
  name: string;
  phone?: string | null;
  balance?: number;
};

export type PosDraft = {
  id: string;
  label: string;
  savedAt: string;
  customer: PosCustomer | null;
  items: PosCartItem[];
  taxPercent: number;
  discountAmount: number;
  shippingAmount: number;
  fulfillmentType: PosFulfillmentType;
  deliveryDetails: DeliveryDetails;
};

type PosState = {
  customer: PosCustomer | null;
  items: PosCartItem[];
  taxPercent: number;
  discountAmount: number;
  shippingAmount: number;
  fulfillmentType: PosFulfillmentType;
  deliveryDetails: DeliveryDetails;
  drafts: PosDraft[];
  setCustomer: (c: PosCustomer | null) => void;
  addItem: (item: Omit<PosCartItem, "quantity">, qty?: number) => boolean;
  updateQty: (lineKey: string, quantity: number) => void;
  updatePrice: (lineKey: string, unitPrice: number) => void;
  removeItem: (lineKey: string) => void;
  setTaxPercent: (n: number) => void;
  setDiscountAmount: (n: number) => void;
  setShippingAmount: (n: number) => void;
  setFulfillmentType: (type: PosFulfillmentType) => void;
  updateDeliveryDetails: (details: Partial<DeliveryDetails>) => void;
  reset: () => void;
  hold: (label?: string) => void;
  restoreDraft: (id: string) => void;
  removeDraft: (id: string) => void;
};

function calcSummary(
  items: PosCartItem[],
  taxPercent: number,
  discount: number,
  shipping: number,
) {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const grandTotal = Math.max(0, subtotal + taxAmount - discount + shipping);
  return { subtotal, taxAmount, grandTotal };
}

export const usePosCart = create<PosState>()(
  persist(
    (set, get) => ({
      customer: null,
      items: [],
      taxPercent: 0,
      discountAmount: 0,
      shippingAmount: 0,
      fulfillmentType: "pickup",
      deliveryDetails: {},
      drafts: [],

      setCustomer: (customer) => set({ customer }),

      addItem: (item, qty = 1) => {
        const lineKey =
          item.lineKey ?? `${item.productId}:${item.variantId ?? ""}`;
        const items = get().items;
        const existing = items.find((i) => i.lineKey === lineKey);
        const currentQty = existing?.quantity ?? 0;
        const maxStock = item.stockQuantity;
        const requested = currentQty + qty;

        if (requested > maxStock) {
          if (currentQty >= maxStock) return false;
          qty = maxStock - currentQty;
        }

        if (existing) {
          set({
            items: items.map((i) =>
              i.lineKey === lineKey
                ? { ...i, quantity: i.quantity + qty }
                : i,
            ),
          });
        } else {
          set({
            items: [...items, { ...item, lineKey, quantity: qty }],
          });
        }
        return true;
      },

      updateQty: (lineKey, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.lineKey !== lineKey) });
          return;
        }
        set({
          items: get().items.map((i) => {
            if (i.lineKey !== lineKey) return i;
            const capped = Math.min(quantity, i.stockQuantity);
            return { ...i, quantity: capped };
          }),
        });
      },

      updatePrice: (lineKey, unitPrice) =>
        set({
          items: get().items.map((i) =>
            i.lineKey === lineKey ? { ...i, unitPrice } : i,
          ),
        }),

      removeItem: (lineKey) =>
        set({ items: get().items.filter((i) => i.lineKey !== lineKey) }),

      setTaxPercent: (taxPercent) => set({ taxPercent }),
      setDiscountAmount: (discountAmount) => set({ discountAmount }),
      setShippingAmount: (shippingAmount) => set({ shippingAmount }),
      setFulfillmentType: (fulfillmentType) =>
        set((state) => ({
          fulfillmentType,
          shippingAmount:
            fulfillmentType === "pickup" ? 0 : state.shippingAmount,
          deliveryDetails:
            fulfillmentType === "pickup" ? {} : state.deliveryDetails,
        })),
      updateDeliveryDetails: (details) =>
        set((state) => ({
          deliveryDetails: { ...state.deliveryDetails, ...details },
        })),

      reset: () =>
        set({
          customer: get().customer,
          items: [],
          discountAmount: 0,
          shippingAmount: 0,
          fulfillmentType: "pickup",
          deliveryDetails: {},
        }),

      hold: (label) => {
        const state = get();
        if (state.items.length === 0) return;
        const draft: PosDraft = {
          id: crypto.randomUUID(),
          label: label ?? `Draft ${state.drafts.length + 1}`,
          savedAt: new Date().toISOString(),
          customer: state.customer,
          items: state.items,
          taxPercent: state.taxPercent,
          discountAmount: state.discountAmount,
          shippingAmount: state.shippingAmount,
          fulfillmentType: state.fulfillmentType,
          deliveryDetails: state.deliveryDetails,
        };
        set({
          drafts: [draft, ...state.drafts].slice(0, 10),
          items: [],
          discountAmount: 0,
          shippingAmount: 0,
          fulfillmentType: "pickup",
          deliveryDetails: {},
        });
      },

      restoreDraft: (id) => {
        const draft = get().drafts.find((d) => d.id === id);
        if (!draft) return;
        set({
          customer: draft.customer,
          items: draft.items,
          taxPercent: draft.taxPercent,
          discountAmount: draft.discountAmount,
          shippingAmount: draft.shippingAmount,
          fulfillmentType: draft.fulfillmentType ?? "pickup",
          deliveryDetails: draft.deliveryDetails ?? {},
          drafts: get().drafts.filter((d) => d.id !== id),
        });
      },

      removeDraft: (id) =>
        set({ drafts: get().drafts.filter((d) => d.id !== id) }),
    }),
    { name: "pos-cart-v1", partialize: (s) => ({ drafts: s.drafts }) },
  ),
);

export function usePosSummary() {
  const items = usePosCart((s) => s.items);
  const taxPercent = usePosCart((s) => s.taxPercent);
  const discountAmount = usePosCart((s) => s.discountAmount);
  const shippingAmount = usePosCart((s) => s.shippingAmount);
  return calcSummary(items, taxPercent, discountAmount, shippingAmount);
}
