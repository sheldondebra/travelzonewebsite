"use client";

import { Layers, Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import {
  displayRetailPrice,
  type ProductRow,
} from "@/components/products/product-types";
import { pos } from "@/components/pos/pos-styles";
import { cn } from "@/lib/utils";
import { getProductImageUrl } from "@/lib/products/image";

function formatTilePrice(
  product: ProductRow,
  currency: string,
  formatMoney?: (n: number) => string,
) {
  if (formatMoney) {
    if (product.productType === "VARIABLE" && product.variants?.length) {
      const prices = product.variants.map((v) => v.retailPrice);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max
        ? formatMoney(min)
        : `${formatMoney(min)}+`;
    }
    return formatMoney(product.price);
  }
  return `${currency} ${displayRetailPrice(product)}`;
}

export function PosProductCard({
  product,
  currency,
  formatMoney,
  onClick,
}: {
  product: ProductRow;
  currency: string;
  formatMoney?: (n: number) => string;
  onClick: () => void;
}) {
  const outOfStock = product.stockQuantity <= 0;
  const lowStock =
    !outOfStock && product.stockQuantity <= (product.stockAlert ?? 5);
  const isVariable = product.productType === "VARIABLE";
  const hasImage = !!getProductImageUrl(product.imageUrl);
  const priceLabel = formatTilePrice(product, currency, formatMoney);

  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={onClick}
      className={cn(
        pos.cardCompact,
        pos.cardHover,
        "group relative flex h-full flex-col overflow-hidden p-0 text-left",
        outOfStock && "cursor-not-allowed opacity-55",
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-brand-cream via-white to-brand-rose/20">
        {hasImage ? (
          <ProductThumbnail
            imageUrl={product.imageUrl}
            name={product.name}
            sizes="(max-width: 640px) 45vw, 220px"
            className="size-full rounded-none object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <Package className="size-9 text-primary/30" strokeWidth={1.25} />
          </span>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-2">
          {isVariable ? (
            <Badge className="h-5 gap-0.5 border-0 bg-white/90 px-1.5 text-[9px] font-medium text-foreground shadow-sm backdrop-blur-sm">
              <Layers className="size-2.5" />
              Options
            </Badge>
          ) : (
            <span />
          )}
          {!outOfStock && (
            <Badge
              variant="secondary"
              className={cn(
                "h-5 border-0 px-1.5 text-[9px] font-medium tabular-nums shadow-sm backdrop-blur-sm",
                lowStock
                  ? "bg-amber-100/95 text-amber-900"
                  : "bg-white/90 text-muted-foreground",
              )}
            >
              {product.stockQuantity} left
            </Badge>
          )}
        </div>

        {outOfStock ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
            <Badge variant="secondary" className="bg-red-50 text-[10px] text-red-700">
              Sold out
            </Badge>
          </span>
        ) : (
          <span className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-105 group-active:scale-95">
            <Plus className="size-4" strokeWidth={2.5} />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-3 py-2.5">
        <p className="line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-snug tracking-tight">
          {product.name}
        </p>
        <p className="mt-auto text-[15px] font-bold tabular-nums tracking-tight text-foreground">
          {priceLabel}
        </p>
      </div>
    </button>
  );
}
