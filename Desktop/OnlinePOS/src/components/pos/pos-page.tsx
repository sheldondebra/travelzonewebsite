"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Home,
  LayoutGrid,
  ScanLine,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FilterPills } from "@/components/layout/filter-pills";
import { cn } from "@/lib/utils";
import { parseApiResponse } from "@/lib/api-client";
import { usePosCart, usePosSummary, type PosCartItem, type PosCustomer, type PosDraft } from "@/stores/pos-cart";
import { PosPaymentDialog } from "@/components/pos/pos-payment-dialog";
import { PosReceiptDialog } from "@/components/pos/pos-receipt-dialog";
import { PosHeader } from "@/components/pos/pos-header";
import { PosCashierPinDialog } from "@/components/pos/pos-cashier-pin";
import { usePosCashier, posCashierBody, posCashierHeaders } from "@/stores/pos-cashier";
import {
  PosCashMovementDialog,
  PosRegisterCloseDialog,
  PosRegisterOpenDialog,
  PosRegisterReportDialog,
  type RegisterSession,
} from "@/components/pos/pos-register";
import {
  PosCustomerDialog,
  PosCustomerTrigger,
} from "@/components/pos/pos-customer-picker";
import { PosVariantPickerDialog } from "@/components/pos/pos-variant-picker";
import type { ReceiptDeliveryResult } from "@/lib/receipt/types";
import type { DeliveryDetails } from "@/lib/orders/delivery";
import { PosProductCard } from "@/components/pos/pos-product-card";
import { PosCartItemRow } from "@/components/pos/pos-cart-item";
import { pos } from "@/components/pos/pos-styles";
import { useBusinessSettings } from "@/components/settings/business-settings-provider";
import {
  LAST_POS_CUSTOMER_KEY,
  playScanBeep,
} from "@/lib/settings/helpers";
import type {
  ProductRow,
  ProductVariantRow,
} from "@/components/products/product-types";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
};

type Business = { name: string; currency: string; taxRate: number };

type ServerHeldSale = {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
  payload: {
    customer: PosCustomer | null;
    items: PosCartItem[];
    taxPercent: number;
    discountAmount: number;
    shippingAmount: number;
    fulfillmentType?: "pickup" | "delivery";
    deliveryDetails?: DeliveryDetails;
  };
};

type RegisterReport = {
  type: string;
  salesCount: number;
  totalSales: number;
  cashSales: number;
  cashIn: number;
  cashOut: number;
  session: { openingFloat: number; expectedCash: number };
  paymentTotals: Record<string, number>;
};

const PAGE_SIZE = 16;

function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-primary/15 bg-white/90 shadow-card">
      <div className="aspect-square animate-pulse bg-gradient-to-br from-brand-cream to-brand-rose/40" />
      <div className="space-y-2 px-3 py-2.5">
        <div className="h-3.5 w-full rounded-md bg-muted/60" />
        <div className="h-3.5 w-2/3 rounded-md bg-muted/40" />
        <div className="h-4 w-1/2 rounded-md bg-muted/70" />
      </div>
    </div>
  );
}

function PosMobileTabBar({
  tab,
  cartCount,
  onTabChange,
}: {
  tab: "browse" | "cart" | "payment";
  cartCount: number;
  onTabChange: (tab: "browse" | "cart" | "payment") => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
      <nav
        aria-label="POS navigation"
        className="pointer-events-auto mx-auto flex h-[4rem] max-w-lg items-stretch gap-1 rounded-2xl border border-primary/25 bg-gradient-to-r from-white/95 via-brand-cream/95 to-brand-rose/40 p-1.5 shadow-elevated backdrop-blur-xl"
      >
        {(
          [
            { id: "browse" as const, label: "Products", icon: ShoppingBag },
            { id: "cart" as const, label: "Cart", icon: ShoppingCart },
            { id: "payment" as const, label: "Pay", icon: CreditCard },
          ] as const
        ).map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          const disabled = id === "payment" && cartCount === 0;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onTabChange(id)}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-all touch-manipulation sm:text-[11px]",
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-brand-rose/30 hover:text-foreground",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              <Icon className="size-[1.25rem] sm:size-[1.35rem]" strokeWidth={active ? 2.25 : 1.75} />
              <span>{label}</span>
              {id === "cart" && cartCount > 0 && (
                <span className="absolute right-[calc(50%-1.75rem)] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function PosPage() {
  const queryClient = useQueryClient();
  const [mobileTab, setMobileTab] = useState<"browse" | "cart" | "payment">("browse");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [brandId, setBrandId] = useState("all");
  const [page, setPage] = useState(1);
  const [payOpen, setPayOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const [receiptDelivery, setReceiptDelivery] =
    useState<ReceiptDeliveryResult | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [variantPick, setVariantPick] = useState<ProductRow | null>(null);
  const [variantOptions, setVariantOptions] = useState<ProductVariantRow[]>([]);
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [closeRegisterOpen, setCloseRegisterOpen] = useState(false);
  const [cashMovementOpen, setCashMovementOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [registerReport, setRegisterReport] = useState<RegisterReport | null>(null);
  const [pinOpen, setPinOpen] = useState(false);

  const cashierToken = usePosCashier((s) => s.token);
  const activeCashier = usePosCashier((s) => s.cashier);
  const clearCashier = usePosCashier((s) => s.clearCashier);

  const cart = usePosCart();
  const { subtotal, taxAmount, grandTotal } = usePosSummary();
  const cartCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  const { settings, formatMoney } = useBusinessSettings();

  const { data: business } = useQuery({
    queryKey: ["business"],
    queryFn: async () => {
      const res = await fetch("/api/business");
      return parseApiResponse<Business>(res);
    },
  });

  const currency = business?.currency ?? "GHS";

  useEffect(() => {
    const posCart = usePosCart.getState();
    if (business?.taxRate != null && posCart.taxPercent === 0) {
      posCart.setTaxPercent(business.taxRate);
    }
  }, [business?.taxRate]);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products", search, categoryId, brandId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (categoryId !== "all") params.set("categoryId", categoryId);
      if (brandId !== "all") params.set("brandId", brandId);
      const res = await fetch(`/api/products?${params}`);
      return parseApiResponse<ProductRow[]>(res);
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/catalog/categories");
      return parseApiResponse<{ id: string; name: string }[]>(res);
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const res = await fetch("/api/catalog/brands");
      return parseApiResponse<{ id: string; name: string }[]>(res);
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      return parseApiResponse<Customer[]>(res);
    },
  });

  const { data: registerData, isLoading: registerLoading } = useQuery({
    queryKey: ["pos-register"],
    queryFn: async () => {
      const res = await fetch("/api/pos/register/open");
      return parseApiResponse<{ session: RegisterSession | null }>(res);
    },
  });
  const registerSession = registerData?.session ?? null;

  const { data: heldSales = [] } = useQuery({
    queryKey: ["pos-held-sales"],
    queryFn: async () => {
      const res = await fetch("/api/pos/sales/hold");
      return parseApiResponse<ServerHeldSale[]>(res);
    },
  });

  const heldDrafts: PosDraft[] = heldSales.map((h) => ({
    id: h.id,
    label: h.label,
    savedAt: h.updatedAt,
    customer: h.payload.customer,
    items: h.payload.items,
    taxPercent: h.payload.taxPercent,
    discountAmount: h.payload.discountAmount,
    shippingAmount: h.payload.shippingAmount,
    fulfillmentType: h.payload.fulfillmentType ?? "pickup",
    deliveryDetails: h.payload.deliveryDetails ?? {},
  }));

  useEffect(() => {
    if (settings.pos.requireCashierPin && !activeCashier) {
      const timer = window.setTimeout(() => setPinOpen(true), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [settings.pos.requireCashierPin, activeCashier]);

  useEffect(() => {
    if (!settings.pos.autoSelectCustomer || usePosCart.getState().customer) return;
    const lastId = localStorage.getItem(LAST_POS_CUSTOMER_KEY);
    if (!lastId) return;
    const match = customers.find((c) => c.id === lastId);
    if (match) usePosCart.getState().setCustomer(match);
  }, [settings.pos.autoSelectCustomer, customers]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pagedProducts = products.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const categoryPills = [
    { value: "all", label: "All" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const checkoutMutation = useMutation({
    mutationFn: async (payment: {
      paymentMethod: string;
      paymentStatus: string;
      amountPaid: number;
      changeDue?: number;
      momoReference?: string;
      momoNetwork?: string;
      payments?: Array<{
        method: string;
        amount: number;
        reference?: string;
        network?: string;
      }>;
    }) => {
      if (!cart.customer) throw new Error("Select a customer first");
      const res = await fetch("/api/pos/sales", {
        method: "POST",
        headers: posCashierHeaders(cashierToken),
        body: JSON.stringify(
          posCashierBody(
            {
              customerId: cart.customer.id,
              paymentStatus: payment.paymentStatus,
              deliveryStatus:
                cart.fulfillmentType === "delivery" ? "pending" : "pickup",
              paymentMethod: payment.paymentMethod,
              amountPaid: payment.amountPaid,
              changeDue: payment.changeDue,
              momoReference: payment.momoReference,
              momoNetwork: payment.momoNetwork,
              payments: payment.payments,
              registerSessionId: registerSession?.id,
              taxPercent: cart.taxPercent,
              discountAmount: cart.discountAmount,
              shippingAmount:
                cart.fulfillmentType === "delivery" ? cart.shippingAmount : 0,
              deliveryDetails:
                cart.fulfillmentType === "delivery"
                  ? cart.deliveryDetails
                  : undefined,
              notes: "POS sale",
              items: cart.items.map((i) => ({
                productId: i.productId,
                variantId: i.variantId ?? undefined,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
              })),
            },
            cashierToken,
          ),
        ),
      });
      return parseApiResponse<{
        order: { id: string };
        receiptDelivery: ReceiptDeliveryResult;
      }>(res);
    },
    onSuccess: ({ order, receiptDelivery: delivery }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["pos-register"] });
      cart.reset();
      setPayOpen(false);
      setReceiptOrderId(order.id);
      setReceiptDelivery(delivery);
      setReceiptOpen(true);
      setMobileTab("browse");
      const sent = delivery.sms.sent || delivery.email.sent;
      toast.success(
        sent
          ? "Sale completed — receipt sent to customer"
          : "Sale completed",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openRegisterMutation = useMutation({
    mutationFn: async (openingFloat: number) => {
      const res = await fetch("/api/pos/register/open", {
        method: "POST",
        headers: posCashierHeaders(cashierToken),
        body: JSON.stringify(
          posCashierBody({ openingFloat }, cashierToken),
        ),
      });
      return parseApiResponse<{ session: RegisterSession }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-register"] });
      toast.success("Register opened");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeRegisterMutation = useMutation({
    mutationFn: async ({
      countedCash,
      closingNote,
    }: {
      countedCash: number;
      closingNote?: string;
    }) => {
      if (!registerSession) throw new Error("No open register");
      const res = await fetch("/api/pos/register/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: registerSession.id,
          countedCash,
          closingNote,
        }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-register"] });
      setCloseRegisterOpen(false);
      toast.success("Register closed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cashMovementMutation = useMutation({
    mutationFn: async (payload: {
      type: "CASH_IN" | "CASH_OUT";
      amount: number;
      reason: string;
    }) => {
      if (!registerSession) throw new Error("No open register");
      const res = await fetch("/api/pos/register/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: registerSession.id, ...payload }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-register"] });
      setCashMovementOpen(false);
      toast.success("Cash movement recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const holdSaleMutation = useMutation({
    mutationFn: async (label: string) => {
      const res = await fetch("/api/pos/sales/hold", {
        method: "POST",
        headers: posCashierHeaders(cashierToken),
        body: JSON.stringify(
          posCashierBody(
            {
              label,
              customerId: cart.customer?.id,
              payload: {
                customer: cart.customer,
                items: cart.items,
                taxPercent: cart.taxPercent,
                discountAmount: cart.discountAmount,
                shippingAmount: cart.shippingAmount,
                fulfillmentType: cart.fulfillmentType,
                deliveryDetails: cart.deliveryDetails,
              },
            },
            cashierToken,
          ),
        ),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-held-sales"] });
      cart.reset();
      toast.success("Sale held");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteHeldMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pos/sales/hold?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-held-sales"] });
      toast.success("Held sale removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function restoreHeldDraft(id: string) {
    const held = heldSales.find((h) => h.id === id);
    if (!held) return;
    cart.setCustomer(held.payload.customer);
    usePosCart.setState({
      items: held.payload.items,
      taxPercent: held.payload.taxPercent,
      discountAmount: held.payload.discountAmount,
      shippingAmount: held.payload.shippingAmount,
      fulfillmentType: held.payload.fulfillmentType ?? "pickup",
      deliveryDetails: held.payload.deliveryDetails ?? {},
    });
    await deleteHeldMutation.mutateAsync(id);
    setDraftsOpen(false);
    toast.success("Draft restored");
  }

  async function loadRegisterReport(type: "X" | "Z") {
    if (!registerSession) return;
    const res = await fetch(
      `/api/pos/register/report?sessionId=${registerSession.id}&type=${type}`,
    );
    const report = await parseApiResponse<RegisterReport>(res);
    setRegisterReport(report);
  }

  const createCustomerMutation = useMutation({
    mutationFn: async (payload: { name: string; phone?: string }) => {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return parseApiResponse<Customer>(res);
    },
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      cart.setCustomer(c);
      setCustomerOpen(false);
      toast.success("Customer added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openVariantPicker(p: ProductRow) {
    const res = await fetch(`/api/products/${p.id}/variants`);
    const variants = await parseApiResponse<ProductVariantRow[]>(res);
    if (!variants.length) {
      toast.error("No variants available");
      return;
    }
    setVariantOptions(variants.filter((v) => v.isActive));
    setVariantPick(p);
  }

  function addToCart(p: ProductRow, variant?: ProductVariantRow) {
    const stock = variant?.stockQuantity ?? p.stockQuantity;
    if (stock <= 0) {
      toast.error("Out of stock");
      return;
    }
    const unitPrice = variant?.retailPrice ?? p.price;
    const minimumPrice = variant?.minimumPrice ?? p.minimumPrice ?? 0;
    const lineKey = `${p.id}:${variant?.id ?? ""}`;
    const ok = cart.addItem({
      productId: p.id,
      variantId: variant?.id,
      lineKey,
      name: variant ? `${p.name} — ${variant.name}` : p.name,
      code: variant?.sku ?? p.sku ?? p.slug.slice(0, 8),
      unit: p.unitRef?.abbreviation ?? p.unit ?? "pc",
      unitPrice,
      costPrice: variant?.costPrice ?? p.costPrice,
      minimumPrice,
      stockQuantity: stock,
      imageUrl: variant?.imageUrl ?? p.imageUrl,
    });
    if (!ok) {
      toast.error("Maximum stock reached");
      return;
    }
    if (settings.pos.soundOnScan) playScanBeep();
    if (cart.customer) {
      localStorage.setItem(LAST_POS_CUSTOMER_KEY, cart.customer.id);
    }
    toast.success(`Added ${variant ? variant.name : p.name}`, { duration: 1000 });
    if (window.innerWidth < 1024) setMobileTab("cart");
  }

  async function handleWalkInCustomer() {
    setWalkInLoading(true);
    try {
      const res = await fetch("/api/customers/walk-in", { method: "POST" });
      const customer = await parseApiResponse<Customer>(res);
      cart.setCustomer(customer);
      setCustomerOpen(false);
      toast.success("Walk-in customer selected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not set walk-in customer");
    } finally {
      setWalkInLoading(false);
    }
  }

  function tryAddByScan(code: string) {
    const q = code.trim().toLowerCase();
    if (!q) return;

    const localMatch = products.find(
      (p) =>
        p.sku?.toLowerCase() === q ||
        p.barcode?.toLowerCase() === q ||
        p.slug.toLowerCase() === q,
    );
    if (localMatch) {
      addProduct(localMatch);
      setSearch("");
      setPage(1);
      return;
    }

    void (async () => {
      try {
        const res = await fetch(
          `/api/products?q=${encodeURIComponent(code.trim())}`,
        );
        const found = await parseApiResponse<ProductRow[]>(res);
        const exact = found.find(
          (p) =>
            p.sku?.toLowerCase() === q ||
            p.barcode?.toLowerCase() === q ||
            p.slug.toLowerCase() === q,
        );
        const match = exact ?? found[0];
        if (match) {
          addProduct(match);
          setSearch("");
          setPage(1);
          return;
        }
        toast.error("Product not found");
      } catch {
        toast.error("Product not found");
      }
    })();
  }

  function addProduct(p: ProductRow) {
    if (p.productType === "VARIABLE") {
      void openVariantPicker(p);
      return;
    }
    addToCart(p);
  }

  function openPay() {
    if (!cart.customer) {
      toast.error("Select a customer first");
      setCustomerOpen(true);
      if (window.innerWidth < 1024) setMobileTab("payment");
      return;
    }
    if (cart.items.length === 0) {
      toast.error("Add products to the cart first");
      return;
    }
    setPayOpen(true);
  }

  const totalsBlock = (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>Subtotal</span>
        <span className="tabular-nums">{formatMoney(subtotal)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Tax ({cart.taxPercent}%)</span>
        <span className="tabular-nums">{formatMoney(taxAmount)}</span>
      </div>
      {cart.discountAmount > 0 && (
        <div className="flex justify-between text-emerald-700">
          <span>Discount</span>
          <span className="tabular-nums">−{formatMoney(cart.discountAmount)}</span>
        </div>
      )}
      {cart.shippingAmount > 0 && (
        <div className="flex justify-between">
          <span>Delivery fee</span>
          <span className="tabular-nums">{formatMoney(cart.shippingAmount)}</span>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-primary/15 pt-3">
        <span className="text-base font-semibold">Total</span>
        <span className="text-2xl font-bold tabular-nums tracking-tight">
          {formatMoney(grandTotal)}
        </span>
      </div>
    </div>
  );

  const customerPicker = (
    <PosCustomerTrigger
      customer={cart.customer}
      onClick={() => setCustomerOpen(true)}
    />
  );

  const isDelivery = cart.fulfillmentType === "delivery";
  const updateDeliveryField = <K extends keyof DeliveryDetails>(
    key: K,
    value: DeliveryDetails[K],
  ) => cart.updateDeliveryDetails({ [key]: value } as Partial<DeliveryDetails>);

  const fulfillmentPanel = (
    <div className="space-y-3 rounded-2xl border border-primary/15 bg-white/80 p-3 shadow-card">
      <div className="grid grid-cols-2 gap-2">
        {[
          {
            type: "pickup" as const,
            label: "Pickup",
            description: "In-store sale",
            icon: Home,
          },
          {
            type: "delivery" as const,
            label: "Delivery",
            description: "Send to customer",
            icon: Truck,
          },
        ].map(({ type, label, description, icon: Icon }) => {
          const active = cart.fulfillmentType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => cart.setFulfillmentType(type)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all",
                active
                  ? "border-primary bg-primary/15 text-foreground shadow-sm ring-1 ring-primary/20"
                  : "border-gray-100 bg-white text-muted-foreground hover:border-primary/20 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/70 text-muted-foreground",
                )}
              >
                <Icon className="size-4" strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block truncate text-[11px]">{description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {isDelivery && (
        <div className="space-y-3 rounded-xl border border-primary/10 bg-brand-cream/35 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-[10px] uppercase tracking-wide">Phone</Label>
              <Input
                className="mt-1 h-10 rounded-xl"
                placeholder={cart.customer?.phone ?? "Customer phone"}
                value={cart.deliveryDetails.phone ?? ""}
                onChange={(e) => updateDeliveryField("phone", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wide">Scheduled</Label>
              <Input
                type="datetime-local"
                className="mt-1 h-10 rounded-xl"
                value={cart.deliveryDetails.scheduledAt ?? ""}
                onChange={(e) => updateDeliveryField("scheduledAt", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wide">Address</Label>
            <Input
              className="mt-1 h-10 rounded-xl"
              placeholder="Street, landmark, or delivery address"
              value={cart.deliveryDetails.address ?? ""}
              onChange={(e) => updateDeliveryField("address", e.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-[10px] uppercase tracking-wide">City</Label>
              <Input
                className="mt-1 h-10 rounded-xl"
                placeholder="Accra"
                value={cart.deliveryDetails.city ?? ""}
                onChange={(e) => updateDeliveryField("city", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wide">Region</Label>
              <Input
                className="mt-1 h-10 rounded-xl"
                placeholder="Greater Accra"
                value={cart.deliveryDetails.region ?? ""}
                onChange={(e) => updateDeliveryField("region", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-[10px] uppercase tracking-wide">Rider</Label>
              <Input
                className="mt-1 h-10 rounded-xl"
                placeholder="Rider name"
                value={cart.deliveryDetails.riderName ?? ""}
                onChange={(e) => updateDeliveryField("riderName", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wide">Rider phone</Label>
              <Input
                className="mt-1 h-10 rounded-xl"
                placeholder="Rider phone"
                value={cart.deliveryDetails.riderPhone ?? ""}
                onChange={(e) => updateDeliveryField("riderPhone", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wide">Tracking number</Label>
            <Input
              className="mt-1 h-10 rounded-xl"
              placeholder="Optional tracking number"
              value={cart.deliveryDetails.trackingNumber ?? ""}
              onChange={(e) => updateDeliveryField("trackingNumber", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wide">Delivery notes</Label>
            <Textarea
              className="mt-1 min-h-20 rounded-xl bg-white"
              placeholder="Gate code, landmark, delivery instructions..."
              value={cart.deliveryDetails.notes ?? ""}
              onChange={(e) => updateDeliveryField("notes", e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );

  const adjustmentFields = (
    <div className="grid gap-2 rounded-2xl border border-primary/15 bg-white/80 p-3 sm:grid-cols-3">
      <div>
        <Label className="text-[10px] uppercase tracking-wide">Tax %</Label>
        <Input
          type="number"
          min={0}
          className="mt-1 h-10 rounded-xl"
          value={cart.taxPercent}
          onChange={(e) => cart.setTaxPercent(Number(e.target.value))}
        />
      </div>
      <div>
        <Label className="text-[10px] uppercase tracking-wide">Discount</Label>
        <Input
          type="number"
          min={0}
          className="mt-1 h-10 rounded-xl"
          value={cart.discountAmount}
          onChange={(e) => cart.setDiscountAmount(Number(e.target.value))}
        />
      </div>
      {isDelivery && (
        <div>
          <Label className="text-[10px] uppercase tracking-wide">Delivery fee</Label>
          <Input
            type="number"
            min={0}
            className="mt-1 h-10 rounded-xl"
            value={cart.shippingAmount}
            onChange={(e) => cart.setShippingAmount(Number(e.target.value))}
          />
        </div>
      )}
    </div>
  );

  const paymentPanelMobile = (
    <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-brand-rose/25 via-white/90 to-brand-cream/30">
      <div className="shrink-0 space-y-3 px-4 pb-3 pt-4 sm:px-5">
        <div>
          <p className={pos.sectionLabel}>Payment</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Complete sale</h2>
        </div>
        <div>
          <p className={cn(pos.sectionLabel, "mb-2")}>Customer</p>
          {customerPicker}
        </div>
        {fulfillmentPanel}
        {cart.items.length > 0 && (
          <div className="rounded-xl border border-primary/15 bg-white/80 px-3 py-2.5 text-sm">
            <span className="font-semibold tabular-nums">{cartCount}</span>{" "}
            {cartCount === 1 ? "item" : "items"} in cart
            <button
              type="button"
              className="ml-2 text-xs font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => setMobileTab("cart")}
            >
              Edit cart
            </button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-5">
        {cart.items.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-white/60 p-6 text-center">
            <CreditCard className="mb-3 size-10 text-primary/50" />
            <p className="font-semibold">Nothing to pay yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add products from the catalog first
            </p>
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={() => setMobileTab("browse")}
            >
              Browse products
            </Button>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl border border-primary/15 bg-white/80 p-4 shadow-card">
            <button
              type="button"
              onClick={() => setAdjustOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-primary/10 bg-brand-cream/40 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="size-4" />
                Tax, discount & delivery
              </span>
              <ChevronRight
                className={cn(
                  "size-4 transition-transform",
                  adjustOpen && "rotate-90",
                )}
              />
            </button>
            {adjustOpen && adjustmentFields}
            {totalsBlock}
            <Button
              className="h-[3.25rem] w-full rounded-xl text-base font-bold shadow-soft"
              onClick={openPay}
            >
              Charge {formatMoney(grandTotal)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const checkoutPanel = (
    <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-brand-rose/25 via-white/90 to-brand-cream/30">
      <div className="shrink-0 space-y-3 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={pos.sectionLabel}>Current sale</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">Checkout</h2>
          </div>
          {cartCount > 0 && (
            <Badge className="rounded-full border-0 bg-primary/25 px-3 py-1 text-xs font-semibold tabular-nums">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </Badge>
          )}
        </div>
        <div>
          <p className={cn(pos.sectionLabel, "mb-2")}>Customer</p>
          {customerPicker}
        </div>
        {fulfillmentPanel}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin sm:px-5">
        {cart.items.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-white/60 p-6 text-center sm:min-h-[240px] sm:p-8">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/40 to-brand-cream shadow-soft">
              <ShoppingCart className="size-7 text-primary-foreground/80" strokeWidth={1.5} />
            </div>
            <p className="font-semibold tracking-tight">Your cart is empty</p>
            <p className="mt-1.5 max-w-[240px] text-sm leading-relaxed text-muted-foreground">
              Select products from the catalog to build an order
            </p>
            <Button
              variant="outline"
              className="mt-5 rounded-xl border-primary/25 bg-white/80 lg:hidden"
              onClick={() => setMobileTab("browse")}
            >
              Browse catalog
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className={pos.sectionLabel}>Selected items</p>
            <ul className="space-y-2.5">
              {cart.items.map((item) => (
                <PosCartItemRow
                  key={item.lineKey}
                  item={item}
                  currency={currency}
                  allowPriceEdit={settings.pos.allowPriceEdit}
                  formatMoney={formatMoney}
                  onUpdateQty={(qty) => cart.updateQty(item.lineKey, qty)}
                  onUpdatePrice={(price) => cart.updatePrice(item.lineKey, price)}
                  onRemove={() => cart.removeItem(item.lineKey)}
                  onPriceBelowMin={(min) =>
                    toast.error(`Cannot sell below ${formatMoney(min)}`)
                  }
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={cn(pos.checkoutFooter, "hidden lg:block")}>
        <button
          type="button"
          onClick={() => setAdjustOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-primary/10 bg-white/70 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="size-4" />
            Tax, discount & delivery
          </span>
          <ChevronRight
            className={cn(
              "size-4 transition-transform",
              adjustOpen && "rotate-90",
            )}
          />
        </button>

        {adjustOpen && adjustmentFields}

        {totalsBlock}

        <Button
          className="h-[3.25rem] w-full rounded-xl text-base font-bold shadow-soft"
          disabled={cart.items.length === 0}
          onClick={openPay}
        >
          Charge {formatMoney(grandTotal)}
        </Button>
      </div>
    </div>
  );

  const productPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
        <div className={cn(pos.card, "p-3.5 sm:p-4")}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-sm">
                <Store className="size-4 text-primary-foreground" />
              </span>
              <div>
                <p className={pos.sectionLabel}>Catalog</p>
                <h2 className="text-base font-bold tracking-tight">Products</h2>
              </div>
            </div>
            <Badge className="rounded-full border-0 bg-brand-rose/60 px-2.5 text-[11px] font-medium tabular-nums">
              {products.length} items
            </Badge>
          </div>

          <div className="relative">
            <ScanLine className="absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-primary/80" />
            <Input
              className={cn(pos.inputLg, "border-primary/20 bg-brand-cream/50 pl-10 pr-10")}
              placeholder="Scan barcode or search products…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  tryAddByScan(search);
                }
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="mt-3 space-y-3">
            <FilterPills
              options={categoryPills}
              value={categoryId}
              onChange={(v) => {
                setCategoryId(v);
                setPage(1);
              }}
            />

            {brands.length > 0 && (
              <Select
                value={brandId}
                onValueChange={(v) => {
                  setBrandId(v ?? "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 rounded-xl border-primary/15 bg-brand-cream/50">
                  <span className="flex items-center gap-2 text-sm">
                    <Tag className="size-3.5 text-muted-foreground" />
                    <SelectValue placeholder="All brands" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All brands</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin sm:px-5">
        {productsLoading ? (
          <div className={cn(pos.productGridMobile, "lg:hidden")}>
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : null}
        {productsLoading ? (
          <div className={cn(pos.productGrid, "hidden lg:grid")}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={`lg-${i}`} />
            ))}
          </div>
        ) : pagedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-white/75 py-16 text-center shadow-card sm:py-20">
            <LayoutGrid className="mb-3 size-10 text-muted-foreground/35" />
            <p className="font-semibold tracking-tight">No products found</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Try another search or category filter
            </p>
          </div>
        ) : (
          <>
            <div className={cn(pos.productGridMobile, "lg:hidden")}>
              {pagedProducts.map((p) => (
                <PosProductCard
                  key={p.id}
                  product={p}
                  currency={currency}
                  formatMoney={formatMoney}
                  onClick={() => addProduct(p)}
                />
              ))}
            </div>
            <div className={cn(pos.productGrid, "hidden lg:grid")}>
              {pagedProducts.map((p) => (
                <PosProductCard
                  key={`lg-${p.id}`}
                  product={p}
                  currency={currency}
                  formatMoney={formatMoney}
                  onClick={() => addProduct(p)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-primary/15 bg-white/85 px-4 py-3 backdrop-blur-sm sm:px-5">
          <span className="text-sm text-muted-foreground">
            Page <span className="font-semibold text-foreground">{page}</span> of{" "}
            {totalPages}
          </span>
          <div className="flex gap-1.5">
            <Button
              size="icon"
              variant="outline"
              className="size-9 rounded-xl"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="size-9 rounded-xl"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PosHeader
        businessName={business?.name}
        cartCount={cartCount}
        grandTotal={grandTotal}
        formatMoney={formatMoney}
        drafts={heldDrafts}
        draftsOpen={draftsOpen}
        onDraftsOpenChange={setDraftsOpen}
        registerSession={registerSession}
        activeCashier={activeCashier}
        onSwitchCashier={
          settings.pos.allowCashierSwitch
            ? () => {
                clearCashier();
                setPinOpen(true);
              }
            : undefined
        }
        onCloseRegister={() => setCloseRegisterOpen(true)}
        onCashMovement={() => setCashMovementOpen(true)}
        onRegisterReport={() => {
          setReportOpen(true);
          void loadRegisterReport("X");
        }}
        onHold={() => {
          if (cart.items.length === 0) return;
          const label = `Draft ${heldDrafts.length + 1}`;
          holdSaleMutation.mutate(label);
        }}
        onReset={() => {
          cart.reset();
          cart.setCustomer(null);
          toast.success("Checkout reset");
        }}
        onRestoreDraft={(id) => void restoreHeldDraft(id)}
        onDeleteDraft={(id) => deleteHeldMutation.mutate(id)}
      />

      <div className="hidden min-h-0 flex-1 lg:flex">
        <div className="w-[min(100%,420px)] shrink-0 border-r border-primary/15 lg:w-[390px] xl:w-[400px]">
          {checkoutPanel}
        </div>
        <div className="min-w-0 flex-1">{productPanel}</div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="min-h-0 flex-1 overflow-hidden pb-[4.75rem]">
          {mobileTab === "browse" && productPanel}
          {mobileTab === "cart" && checkoutPanel}
          {mobileTab === "payment" && paymentPanelMobile}
        </div>
        <PosMobileTabBar
          tab={mobileTab}
          cartCount={cartCount}
          onTabChange={setMobileTab}
        />
      </div>

      {/* Variant picker */}
      <PosVariantPickerDialog
        open={!!variantPick}
        product={variantPick}
        variants={variantOptions}
        formatMoney={formatMoney}
        onOpenChange={(open) => !open && setVariantPick(null)}
        onSelect={(v) => {
          if (variantPick) addToCart(variantPick, v);
          setVariantPick(null);
        }}
      />

      <PosPaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        grandTotal={grandTotal}
        currency={currency}
        itemCount={cartCount}
        paymentMethods={settings.paymentMethods}
        defaultPaymentMethod={settings.pos.defaultPaymentMethod}
        allowPayLater={settings.paymentMethods.payLater}
        formatMoney={formatMoney}
        loading={checkoutMutation.isPending}
        onComplete={(payment) => checkoutMutation.mutate(payment)}
      />

      <PosReceiptDialog
        orderId={receiptOrderId}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        initialDelivery={receiptDelivery}
      />

      <PosCustomerDialog
        open={customerOpen}
        onOpenChange={setCustomerOpen}
        customers={customers}
        selectedId={cart.customer?.id}
        walkInLoading={walkInLoading}
        createPending={createCustomerMutation.isPending}
        onSelect={(c) => {
          cart.setCustomer(c);
          localStorage.setItem(LAST_POS_CUSTOMER_KEY, c.id);
          setCustomerOpen(false);
        }}
        onWalkIn={() => void handleWalkInCustomer()}
        onCreate={(name, phone) =>
          createCustomerMutation.mutate({ name, phone })
        }
      />

      <PosRegisterOpenDialog
        open={!registerLoading && !registerSession}
        loading={openRegisterMutation.isPending}
        errorMessage={openRegisterMutation.error?.message ?? null}
        onOpen={(openingFloat) => openRegisterMutation.mutate(openingFloat)}
      />

      <PosRegisterCloseDialog
        open={closeRegisterOpen}
        onOpenChange={setCloseRegisterOpen}
        session={registerSession}
        formatMoney={formatMoney}
        loading={closeRegisterMutation.isPending}
        onClose={(countedCash, closingNote) =>
          closeRegisterMutation.mutate({ countedCash, closingNote })
        }
      />

      <PosCashMovementDialog
        open={cashMovementOpen}
        onOpenChange={setCashMovementOpen}
        loading={cashMovementMutation.isPending}
        onSubmit={(data) => cashMovementMutation.mutate(data)}
      />

      <PosRegisterReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        report={registerReport}
        formatMoney={formatMoney}
        onGenerate={(type) => void loadRegisterReport(type)}
      />

      <PosCashierPinDialog
        open={pinOpen}
        required={settings.pos.requireCashierPin && !activeCashier}
        onOpenChange={setPinOpen}
      />
    </div>
  );
}
