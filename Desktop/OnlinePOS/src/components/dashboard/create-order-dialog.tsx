"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  CreditCard,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import type { ProductRow } from "@/components/products/product-types";
import { displayRetailPrice } from "@/components/products/product-types";
import { parseApiResponse } from "@/lib/api-client";
import { useBusinessSettings } from "@/components/settings/business-settings-provider";
import { getEnabledPaymentMethods } from "@/lib/settings/helpers";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

const STEPS = [
  { id: 1, label: "Customer", icon: User },
  { id: 2, label: "Product", icon: Package },
  { id: 3, label: "Confirm", icon: Check },
] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (orderId: string) => void;
  trigger?: React.ReactNode;
};

export function CreateOrderDialog({ open, onOpenChange, onCreated, trigger }: Props) {
  const queryClient = useQueryClient();
  const { settings } = useBusinessSettings();
  const paymentMethods = useMemo(
    () =>
      getEnabledPaymentMethods(settings.paymentMethods).map((m) => ({
        value: m.value,
        label: m.label,
      })),
    [settings.paymentMethods],
  );
  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  useEffect(() => {
    if (!open) {
      setStep(1);
      setCustomerId("");
      setCustomerSearch("");
      setProductId("");
      setVariantId("");
      setProductSearch("");
      setQuantity(1);
      const defaultMethod = settings.pos.defaultPaymentMethod;
      const enabled = getEnabledPaymentMethods(settings.paymentMethods);
      setPaymentMethod(
        enabled.some((m) => m.value === defaultMethod)
          ? defaultMethod
          : enabled[0]?.value ?? "CASH",
      );
    }
  }, [open, settings.pos.defaultPaymentMethod, settings.paymentMethods]);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      return parseApiResponse<Customer[]>(res);
    },
    enabled: open,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", "order-create"],
    queryFn: async () => {
      const res = await fetch("/api/products?status=active");
      return parseApiResponse<ProductRow[]>(res);
    },
    enabled: open,
  });

  const { data: productDetail } = useQuery({
    queryKey: ["product", productId, "order-create"],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      return parseApiResponse<ProductRow>(res);
    },
    enabled: open && !!productId,
  });

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedProduct = productDetail ?? products.find((p) => p.id === productId);
  const selectedVariant = selectedProduct?.variants?.find((v) => v.id === variantId);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q),
    );
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q),
    );
  }, [products, productSearch]);

  const unitPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    if (selectedProduct.productType === "VARIABLE" && selectedVariant) {
      return selectedVariant.retailPrice;
    }
    return selectedProduct.price;
  }, [selectedProduct, selectedVariant]);

  const stockAvailable = useMemo(() => {
    if (!selectedProduct) return 0;
    if (selectedProduct.productType === "VARIABLE" && selectedVariant) {
      return selectedVariant.stockQuantity;
    }
    return selectedProduct.stockQuantity;
  }, [selectedProduct, selectedVariant]);

  const lineTotal = unitPrice * quantity;

  function selectProduct(id: string) {
    setProductId(id);
    setVariantId("");
    setQuantity(1);
    const p = products.find((x) => x.id === id);
    if (p?.productType === "VARIABLE" && p.variants?.length === 1) {
      setVariantId(p.variants[0].id);
    }
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const item: {
        productId: string;
        variantId?: string;
        quantity: number;
      } = { productId, quantity };
      if (selectedProduct?.productType === "VARIABLE" && variantId) {
        item.variantId = variantId;
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          paymentStatus: "pending",
          deliveryStatus: "pending",
          paymentMethod,
          items: [item],
        }),
      });
      const data = await parseApiResponse<
        { order: { id: string }; receiptDelivery?: unknown } | { id: string }
      >(res);
      if ("order" in data && data.order) return data.order;
      return data as { id: string };
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-stats"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Order created");
      onOpenChange(false);
      onCreated?.(order.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function canContinue(): boolean {
    if (step === 1) return !!customerId;
    if (step === 2) {
      if (!productId || quantity < 1) return false;
      if (selectedProduct?.productType === "VARIABLE" && !variantId) return false;
      if (quantity > stockAvailable) return false;
      return true;
    }
    return true;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}
      <DialogContent className="flex max-h-[92vh] w-[min(100vw-1rem,48rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-gray-100 bg-brand-cream/30 px-6 py-5">
          <DialogTitle className="text-xl">New order</DialogTitle>
          <DialogDescription>
            Step {step} of 3 — find a customer, pick a product, then confirm.
          </DialogDescription>
          <ol className="mt-4 flex gap-2">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const active = s.id === step;
              const done = s.id < step;
              return (
                <li
                  key={s.id}
                  className={cn(
                    "flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium",
                    active && "border-primary bg-primary/10 text-primary",
                    done && "border-emerald-200 bg-emerald-50 text-emerald-800",
                    !active && !done && "border-gray-100 bg-white text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="size-3.5 shrink-0" />
                  ) : (
                    <Icon className="size-3.5 shrink-0" />
                  )}
                  <span className="hidden truncate sm:inline">{s.label}</span>
                </li>
              );
            })}
          </ol>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="rounded-xl pl-9"
                  placeholder="Search customer by name, phone, or email…"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-[min(50vh,360px)] space-y-2 overflow-y-auto rounded-xl border border-gray-100 p-2">
                {filteredCustomers.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No customers match your search
                  </p>
                ) : (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCustomerId(c.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors touch-manipulation",
                        customerId === c.id
                          ? "border-primary bg-primary/10 shadow-soft"
                          : "border-transparent hover:bg-muted/50",
                      )}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="size-4 text-muted-foreground" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium">{c.name}</p>
                        {(c.phone || c.email) && (
                          <p className="text-xs text-muted-foreground">
                            {[c.phone, c.email].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      {customerId === c.id && (
                        <Check className="ml-auto size-4 shrink-0 text-primary" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="rounded-xl pl-9"
                    placeholder="Search product by name, SKU, or barcode…"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-[min(40vh,280px)] space-y-2 overflow-y-auto rounded-xl border border-gray-100 p-2">
                  {filteredProducts.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No products match your search
                    </p>
                  ) : (
                    filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectProduct(p.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors touch-manipulation",
                          productId === p.id
                            ? "border-primary bg-primary/10 shadow-soft"
                            : "border-transparent hover:bg-muted/50",
                        )}
                      >
                        <ProductThumbnail
                          imageUrl={p.imageUrl ?? p.variants?.[0]?.imageUrl}
                          name={p.name}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ₵{displayRetailPrice(p)} · Stock {p.stockQuantity}
                          </p>
                        </div>
                        {productId === p.id && (
                          <Check className="size-4 shrink-0 text-primary" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-muted/20 p-4">
                {!selectedProduct ? (
                  <div className="flex min-h-[200px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
                    <Package className="mb-2 size-8 opacity-40" />
                    Select a product to view details
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <ProductThumbnail
                        imageUrl={
                          selectedVariant?.imageUrl ??
                          selectedProduct.imageUrl ??
                          selectedProduct.variants?.[0]?.imageUrl
                        }
                        name={selectedProduct.name}
                        className="size-16 rounded-2xl"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug">{selectedProduct.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge variant="secondary">
                            {selectedProduct.productType === "VARIABLE"
                              ? "Variable"
                              : "Normal"}
                          </Badge>
                          {selectedProduct.sku && (
                            <Badge variant="outline">SKU: {selectedProduct.sku}</Badge>
                          )}
                        </div>
                        <p className="mt-2 text-lg font-bold tabular-nums">
                          ₵{unitPrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stockAvailable} in stock
                        </p>
                      </div>
                    </div>

                    {selectedProduct.productType === "VARIABLE" &&
                      (selectedProduct.variants?.length ?? 0) > 0 && (
                        <div className="space-y-2">
                          <Label>Option / size *</Label>
                          <Select
                            value={variantId}
                            onValueChange={(v) => setVariantId(v ?? "")}
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Choose option" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedProduct.variants!.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.name} — ₵{v.retailPrice.toFixed(2)} (stock{" "}
                                  {v.stockQuantity})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-10 shrink-0"
                          disabled={quantity <= 1}
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        >
                          <Minus className="size-4" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          max={stockAvailable || undefined}
                          className="h-10 rounded-xl text-center tabular-nums"
                          value={quantity}
                          onChange={(e) =>
                            setQuantity(Math.max(1, Number(e.target.value) || 1))
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-10 shrink-0"
                          disabled={quantity >= stockAvailable}
                          onClick={() =>
                            setQuantity((q) => Math.min(stockAvailable, q + 1))
                          }
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                      {quantity > stockAvailable && stockAvailable > 0 && (
                        <p className="text-xs text-destructive">
                          Only {stockAvailable} available
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Payment method</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(v) => setPaymentMethod(v ?? "CASH")}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="rounded-xl bg-white p-3 shadow-soft">
                      <p className="text-xs text-muted-foreground">Line total</p>
                      <p className="text-2xl font-bold tabular-nums">
                        ₵{lineTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && selectedCustomer && selectedProduct && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Review everything before creating the order.
              </p>
              <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-soft">
                <ConfirmRow
                  icon={User}
                  label="Customer"
                  value={selectedCustomer.name}
                  detail={[selectedCustomer.phone, selectedCustomer.email]
                    .filter(Boolean)
                    .join(" · ")}
                />
                <ConfirmRow
                  icon={Package}
                  label="Product"
                  value={
                    selectedVariant
                      ? `${selectedProduct.name} (${selectedVariant.name})`
                      : selectedProduct.name
                  }
                  detail={`₵${unitPrice.toFixed(2)} each`}
                />
                <ConfirmRow
                  icon={ShoppingCart}
                  label="Quantity"
                  value={`${quantity} ${quantity === 1 ? "item" : "items"}`}
                />
                <ConfirmRow
                  icon={CreditCard}
                  label="Payment"
                  value={
                    paymentMethods.find((m) => m.value === paymentMethod)?.label ??
                    paymentMethod
                  }
                />
                <div className="flex items-center justify-between bg-brand-cream/40 px-4 py-4">
                  <span className="font-semibold">Order total</span>
                  <span className="text-2xl font-bold tabular-nums">
                    ₵{lineTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-white px-6 py-4 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={step === 1}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            {step < 3 ? (
              <Button
                className="w-full sm:w-auto"
                disabled={!canContinue()}
                onClick={() => setStep((s) => s + 1)}
              >
                Continue
                <ChevronRight className="ml-1 size-4" />
              </Button>
            ) : (
              <Button
                className="w-full sm:w-auto"
                disabled={createMutation.isPending || !canContinue()}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Creating…" : "Confirm & create order"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmRow({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex gap-3 px-4 py-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/60">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="font-medium">{value}</p>
        {detail && (
          <p className="text-sm text-muted-foreground">{detail}</p>
        )}
      </div>
    </div>
  );
}

export function CreateOrderDialogTrigger({
  onCreated,
}: {
  onCreated?: (orderId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <CreateOrderDialog
      open={open}
      onOpenChange={setOpen}
      onCreated={onCreated}
      trigger={<Button className="w-full sm:w-auto">New order</Button>}
    />
  );
}
