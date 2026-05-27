"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateProductSku } from "@/lib/products/generate-product-codes";
import { validatePricing } from "@/lib/products/pricing";
import type { VariantDraft } from "@/components/products/product-types";

type VariantRowCardProps = {
  index: number;
  variant: VariantDraft;
  onChange: (next: VariantDraft) => void;
  onRemove?: () => void;
  canRemove: boolean;
};

export function VariantRowCard({
  index,
  variant,
  onChange,
  onRemove,
  canRemove,
}: VariantRowCardProps) {
  const pricing =
    variant.name.trim() && variant.retailPrice !== ""
      ? validatePricing({
          costPrice: Number(variant.costPrice || 0),
          retailPrice: Number(variant.retailPrice || 0),
          wholesalePrice: Number(variant.wholesalePrice || 0),
          minimumPrice: Number(variant.minimumPrice || 0),
        })
      : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gradient-to-r from-white via-brand-cream/80 to-brand-rose/35 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Option {index + 1}</p>
          <p className="text-xs text-muted-foreground">
            Add the option name, stock, and prices.
          </p>
        </div>
        {canRemove && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:bg-white/80 hover:text-destructive"
            onClick={onRemove}
            aria-label="Remove variant"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm font-semibold text-foreground">Variant name *</Label>
          <Input
            placeholder="e.g. Size M, Red, 500ml, Pack of 6"
            value={variant.name}
            className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-primary/50 focus-visible:border-primary focus-visible:bg-white focus-visible:ring-primary/30"
            onChange={(e) => {
              const name = e.target.value;
              onChange({ ...variant, name, sku: generateProductSku(name) });
            }}
          />
          <p className="text-xs text-muted-foreground">
            Name the option customers choose, like size, color, or pack.
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">SKU (optional)</Label>
          <Input
            placeholder="e.g. DRESS-M-RED"
            value={variant.sku}
            className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-primary/50 focus-visible:border-primary focus-visible:bg-white focus-visible:ring-primary/30"
            onChange={(e) => onChange({ ...variant, sku: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Optional code for this specific option.
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Opening stock</Label>
          <Input
            type="number"
            min={0}
            step={1}
            placeholder="0"
            value={variant.stockQuantity}
            className="h-12 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:border-primary/50 focus-visible:border-primary focus-visible:bg-white focus-visible:ring-primary/30"
            onChange={(e) =>
              onChange({ ...variant, stockQuantity: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground">
            How many of this option you have now.
          </p>
        </div>
      </div>

      <div className="mx-4 mb-4 grid gap-3 rounded-2xl border border-gray-200 bg-brand-cream/35 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <PriceInput
          label="Buying price"
          placeholder="e.g. 45.00"
          hint="Your cost for one option."
          value={variant.costPrice}
          onChange={(v) => onChange({ ...variant, costPrice: v })}
        />
        <PriceInput
          label="Selling price *"
          placeholder="e.g. 89.00"
          hint="Normal price customers pay."
          value={variant.retailPrice}
          onChange={(v) => onChange({ ...variant, retailPrice: v })}
        />
        <PriceInput
          label="Wholesale price"
          placeholder="e.g. 70.00"
          hint="Price for bulk buyers."
          value={variant.wholesalePrice}
          onChange={(v) => onChange({ ...variant, wholesalePrice: v })}
        />
        <PriceInput
          label="Lowest price"
          placeholder="e.g. 75.00"
          hint="Do not sell below this."
          value={variant.minimumPrice}
          onChange={(v) => onChange({ ...variant, minimumPrice: v })}
        />
      </div>

      {pricing && (pricing.errors.length > 0 || pricing.warnings.length > 0) && (
        <div className="mx-4 mb-4 space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
          {pricing.errors.map((e) => (
            <p key={e} className="text-destructive">
              {e}
            </p>
          ))}
          {pricing.warnings.map((w) => (
            <p key={w} className="text-amber-700">
              {w}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function PriceInput({
  label,
  placeholder,
  hint,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-foreground">{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          ₵
        </span>
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder={placeholder}
          className="h-11 rounded-xl border-2 border-gray-200 bg-white pl-8 shadow-sm hover:border-primary/50 focus-visible:border-primary focus-visible:bg-white focus-visible:ring-primary/30"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}
