"use client";

import { Hash, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import { pos } from "@/components/pos/pos-styles";
import type { PosCartItem } from "@/stores/pos-cart";
import { cn } from "@/lib/utils";

export function PosCartItemRow({
  item,
  currency,
  allowPriceEdit = true,
  formatMoney,
  onUpdateQty,
  onUpdatePrice,
  onRemove,
  onPriceBelowMin,
}: {
  item: PosCartItem;
  currency: string;
  allowPriceEdit?: boolean;
  formatMoney?: (amount: number) => string;
  onUpdateQty: (qty: number) => void;
  onUpdatePrice: (price: number) => void;
  onRemove: () => void;
  onPriceBelowMin: (min: number) => void;
}) {
  const lineTotal = item.unitPrice * item.quantity;
  const displayTotal = formatMoney
    ? formatMoney(lineTotal)
    : `${currency} ${lineTotal.toFixed(2)}`;
  const unitLabel = formatMoney
    ? formatMoney(item.unitPrice)
    : `${currency} ${item.unitPrice.toFixed(2)}`;

  const atMaxQty = item.quantity >= item.stockQuantity;

  return (
    <li className="overflow-hidden rounded-2xl border border-primary/20 bg-white shadow-card">
      <div className="flex gap-3 p-3">
        <div className="relative shrink-0">
          <ProductThumbnail
            imageUrl={item.imageUrl}
            name={item.name}
            className="size-16 rounded-xl ring-1 ring-primary/10 sm:size-[4.25rem]"
          />
          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm ring-2 ring-white">
            {item.quantity}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight">
                {item.name}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <Hash className="size-2.5 shrink-0" />
                <span className="truncate">{item.code}</span>
                <span className="text-foreground/30">·</span>
                <span className="shrink-0 uppercase">{item.unit}</span>
              </p>
            </div>
            <button
              type="button"
              aria-label="Remove item"
              onClick={onRemove}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:border-red-100 hover:bg-red-50 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>

          {allowPriceEdit ? (
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Unit
              </span>
              <Input
                type="number"
                className="h-8 max-w-[5.5rem] rounded-lg border-primary/15 bg-brand-cream/50 px-2 text-right text-xs font-semibold tabular-nums"
                value={item.unitPrice}
                min={item.minimumPrice}
                step="0.01"
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isNaN(v)) return;
                  if (v < item.minimumPrice) {
                    onPriceBelowMin(item.minimumPrice);
                    return;
                  }
                  onUpdatePrice(v);
                }}
              />
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground tabular-nums">
              {unitLabel} each
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-primary/10 bg-gradient-to-r from-brand-cream/50 via-brand-rose/20 to-brand-cream/40 px-3 py-2.5">
        <div className="inline-flex items-center rounded-xl border border-primary/15 bg-white p-0.5 shadow-sm">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(pos.touchBtn, "size-9 rounded-lg hover:bg-brand-rose/40")}
            onClick={() => onUpdateQty(item.quantity - 1)}
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-[2rem] px-1 text-center text-sm font-bold tabular-nums">
            {item.quantity}
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              pos.touchBtn,
              "size-9 rounded-lg hover:bg-brand-rose/40",
              atMaxQty && "opacity-40",
            )}
            onClick={() =>
              onUpdateQty(Math.min(item.stockQuantity, item.quantity + 1))
            }
            disabled={atMaxQty}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Line total
          </p>
          <p className="text-base font-bold tabular-nums tracking-tight text-foreground">
            {displayTotal}
          </p>
        </div>
      </div>
    </li>
  );
}
