"use client";

import { Package, ShoppingBag, Tag } from "lucide-react";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type OrderSoldItem = {
  id: string;
  quantity: number;
  price: number;
  lineTotal: number | null;
  lineLabel: string | null;
  product: { name: string; sku: string | null; imageUrl?: string | null };
  variant: { name: string } | null;
};

type Props = {
  items: OrderSoldItem[];
  totalAmount: number;
  formatMoney: (n: number) => string;
  itemCount: number;
  productCount: number;
};

function lineAmount(item: OrderSoldItem) {
  return item.lineTotal ?? item.price * item.quantity;
}

function SoldItemRow({
  item,
  formatMoney,
}: {
  item: OrderSoldItem;
  formatMoney: (n: number) => string;
}) {
  const total = lineAmount(item);

  return (
    <article className="group relative overflow-hidden rounded-xl border border-primary/10 bg-white p-3.5 shadow-sm transition-colors hover:border-primary/20 hover:bg-brand-cream/10 sm:p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-cream/20 via-transparent to-brand-rose/10 opacity-0 transition-opacity group-hover:opacity-100"
      />

      <div className="relative flex gap-3 sm:gap-4">
        <ProductThumbnail
          imageUrl={item.product.imageUrl}
          name={item.product.name}
          className="size-14 rounded-xl sm:size-16"
          sizes="64px"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold leading-snug tracking-tight">
                {item.product.name}
              </h3>
              {item.variant && (
                <p className="mt-0.5 text-xs font-medium text-violet-800">
                  {item.variant.name}
                </p>
              )}
              {item.lineLabel && (
                <p className="mt-0.5 text-xs text-muted-foreground">{item.lineLabel}</p>
              )}
            </div>
            <Badge
              variant="secondary"
              className="shrink-0 rounded-full border-0 bg-primary/15 px-2.5 py-0.5 text-xs font-bold tabular-nums text-primary ring-1 ring-primary/20"
            >
              {item.quantity}×
            </Badge>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {item.product.sku && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Tag className="size-3" />
                {item.product.sku}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatMoney(item.price)} each
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-primary/5 pt-3">
            <span className="text-xs font-medium text-muted-foreground">
              Line total
            </span>
            <span className="text-base font-bold tabular-nums text-foreground">
              {formatMoney(total)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function OrderItemsSold({
  items,
  totalAmount,
  formatMoney,
  itemCount,
  productCount,
}: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-primary/10 bg-gradient-to-r from-brand-cream/40 to-brand-rose/20 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-800">
            <ShoppingBag className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight">What was sold</h2>
            <p className="text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"}
              {productCount > 1 ? ` · ${productCount} products` : ""}
            </p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="rounded-full border-0 bg-white/80 px-3 py-1 text-xs font-semibold text-foreground ring-1 ring-primary/15"
        >
          <Package className="mr-1.5 size-3.5" />
          {items.length} {items.length === 1 ? "line" : "lines"}
        </Badge>
      </div>

      {/* Desktop column headers */}
      <div className="hidden border-b border-primary/5 bg-muted/20 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid lg:grid-cols-[1fr_auto_auto] lg:gap-4">
        <span>Product</span>
        <span className="w-24 text-right">Unit</span>
        <span className="w-28 text-right">Total</span>
      </div>

      {/* Mobile / tablet cards */}
      <div className="space-y-3 p-4 lg:hidden">
        {items.map((item) => (
          <SoldItemRow key={item.id} item={item} formatMoney={formatMoney} />
        ))}
      </div>

      {/* Desktop table rows */}
      <div className="hidden divide-y divide-primary/5 lg:block">
        {items.map((item) => {
          const total = lineAmount(item);
          return (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-brand-cream/15"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ProductThumbnail
                  imageUrl={item.product.imageUrl}
                  name={item.product.name}
                  className="size-12"
                  sizes="48px"
                />
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{item.product.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {item.variant && (
                      <span className="text-xs font-medium text-violet-800">
                        {item.variant.name}
                      </span>
                    )}
                    {item.product.sku && (
                      <span className="text-xs text-muted-foreground">
                        SKU {item.product.sku}
                      </span>
                    )}
                    <Badge
                      variant="secondary"
                      className="h-5 rounded-full bg-primary/10 px-2 text-[10px] font-bold tabular-nums text-primary"
                    >
                      {item.quantity}×
                    </Badge>
                  </div>
                </div>
              </div>
              <span className="w-24 text-right text-sm tabular-nums text-muted-foreground">
                {formatMoney(item.price)}
              </span>
              <span className="w-28 text-right text-base font-bold tabular-nums">
                {formatMoney(total)}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-4 border-t border-primary/10",
          "bg-gradient-to-r from-primary/10 via-brand-rose/20 to-brand-cream/40 px-4 py-4 sm:px-5",
        )}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Order total
          </p>
          <p className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? "unit" : "units"} sold
          </p>
        </div>
        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
          {formatMoney(totalAmount)}
        </p>
      </div>
    </section>
  );
}
