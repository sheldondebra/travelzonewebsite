"use client";

import { Check, Layers, Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import type { ProductRow, ProductVariantRow } from "@/components/products/product-types";
import { pos } from "@/components/pos/pos-styles";
import { capitalizeLabel } from "@/lib/format-label";
import { cn } from "@/lib/utils";

/** First letter uppercase, rest unchanged (sentence-style label). */
export { capitalizeLabel } from "@/lib/format-label";

function stockMeta(variant: ProductVariantRow, alert = 5) {
  if (variant.stockQuantity <= 0) {
    return { label: "Sold out", tone: "out" as const };
  }
  if (variant.stockQuantity <= alert) {
    return {
      label: `${variant.stockQuantity} left`,
      tone: "low" as const,
    };
  }
  return {
    label: `${variant.stockQuantity} in stock`,
    tone: "ok" as const,
  };
}

export function PosVariantPickerDialog({
  open,
  product,
  variants,
  formatMoney,
  onSelect,
  onOpenChange,
}: {
  open: boolean;
  product: ProductRow | null;
  variants: ProductVariantRow[];
  formatMoney: (amount: number) => string;
  onSelect: (variant: ProductVariantRow) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const available = variants.filter((v) => v.stockQuantity > 0).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="gap-0 overflow-hidden rounded-2xl border-gray-100/80 p-0 shadow-elevated sm:max-w-[420px]"
      >
        <DialogHeader className="relative overflow-hidden border-b border-gray-100/80 bg-gradient-to-br from-[#DCC6E0]/35 via-white to-brand-cream px-5 pb-4 pt-5 text-left">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full bg-primary/10 blur-2xl"
          />
          <DialogTitle className="relative flex items-center gap-2 text-base font-bold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#DCC6E0]/50 shadow-sm">
              <Layers className="size-4 text-foreground/80" />
            </span>
            {capitalizeLabel("Choose variant")}
          </DialogTitle>
          <DialogDescription className="relative text-xs">
            {capitalizeLabel("Select an option for this product")}
          </DialogDescription>

          {product && (
            <div className="relative mt-4 flex items-center gap-3 rounded-xl border border-white/80 bg-white/80 p-3 shadow-card backdrop-blur-sm">
              <ProductThumbnail
                imageUrl={product.imageUrl}
                name={product.name}
                className="size-14 shrink-0 rounded-xl ring-1 ring-gray-100/80"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight">
                  {capitalizeLabel(product.name)}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Package className="size-3 shrink-0" />
                  {capitalizeLabel(
                    `${variants.length} option${variants.length === 1 ? "" : "s"} · ${available} available`,
                  )}
                </p>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="max-h-[min(52vh,360px)] space-y-2 overflow-y-auto bg-[#F7F7F8]/50 p-4 scrollbar-thin">
          {variants.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {capitalizeLabel("No variants available")}
            </p>
          ) : (
            variants.map((variant) => {
              const stock = stockMeta(variant);
              const disabled = variant.stockQuantity <= 0;

              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(variant)}
                  className={cn(
                    "group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border bg-white p-3 text-left transition-all touch-manipulation",
                    disabled
                      ? "cursor-not-allowed border-gray-100/80 opacity-50"
                      : "border-gray-100/80 shadow-card hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-soft active:scale-[0.99]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-gray-100/80",
                      disabled ? "bg-muted/40" : "bg-gradient-to-br from-brand-cream to-brand-rose/30",
                    )}
                  >
                    <ProductThumbnail
                      imageUrl={variant.imageUrl ?? product?.imageUrl}
                      name={variant.name}
                      className="size-full rounded-xl"
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold tracking-tight">
                      {capitalizeLabel(variant.name)}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-5 rounded-full px-2 text-[10px] font-medium",
                          stock.tone === "out" && "bg-red-50 text-red-700",
                          stock.tone === "low" && "bg-amber-50 text-amber-900",
                          stock.tone === "ok" && "bg-emerald-50 text-emerald-800",
                        )}
                      >
                        {capitalizeLabel(stock.label)}
                      </Badge>
                      {variant.sku && (
                        <span className="truncate text-[10px] text-muted-foreground">
                          {variant.sku}
                        </span>
                      )}
                    </span>
                  </span>

                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-sm font-bold tabular-nums tracking-tight">
                      {formatMoney(variant.retailPrice)}
                    </span>
                    {!disabled ? (
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        <Plus className="size-3.5" strokeWidth={2.5} />
                      </span>
                    ) : (
                      <Check className="size-4 text-muted-foreground/30" />
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-gray-100/80 bg-white px-5 py-3">
          <p className={cn(pos.sectionLabel, "text-center")}>
            {capitalizeLabel("Tap a variant to add to cart")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
