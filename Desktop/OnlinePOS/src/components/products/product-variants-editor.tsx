"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { DollarSign, Package } from "lucide-react";
import { parseApiResponse } from "@/lib/api-client";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import type { ProductVariantRow } from "@/components/products/product-types";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import { useClientPagination } from "@/hooks/use-client-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ProductVariantsEditor({
  productId,
  productName,
  formatMoney = (n) => `₵${n.toFixed(2)}`,
}: {
  productId: string;
  productName: string;
  formatMoney?: (n: number) => string;
}) {
  const { data: variants = [], isLoading } = useQuery({
    queryKey: ["variants", productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/variants`);
      return parseApiResponse<ProductVariantRow[]>(res);
    },
  });

  const {
    page,
    setPage,
    items,
    total,
    pageSize,
  } = useClientPagination(variants);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-muted/20 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          No variants found for <span className="font-medium">{productName}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{variants.length}</span>{" "}
          variants
        </p>
        <Link
          href="/dashboard/products/bulk-pricing"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Bulk pricing
        </Link>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {items.map((v) => (
          <div
            key={v.id}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-soft"
          >
            <div className="flex items-start gap-3">
              <ProductThumbnail
                imageUrl={v.imageUrl}
                name={v.name}
                className="size-12 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.sku ?? "No SKU"}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span className="font-semibold text-primary">
                    {formatMoney(v.retailPrice)}
                  </span>
                  <span className="text-muted-foreground">
                    W/S {formatMoney(v.wholesalePrice)}
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      v.stockQuantity === 0 && "bg-red-100 text-red-800",
                      v.stockQuantity > 0 &&
                        v.stockQuantity <= 5 &&
                        "bg-amber-100 text-amber-900",
                    )}
                  >
                    {v.stockQuantity} in stock
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-100 lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold">Variant</TableHead>
              <TableHead className="font-semibold">SKU</TableHead>
              <TableHead className="text-right font-semibold">Retail</TableHead>
              <TableHead className="text-right font-semibold">Wholesale</TableHead>
              <TableHead className="text-right font-semibold">Min</TableHead>
              <TableHead className="text-right font-semibold">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ProductThumbnail
                      imageUrl={v.imageUrl}
                      name={v.name}
                      className="size-10"
                    />
                    <span className="font-medium">{v.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{v.sku ?? "—"}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatMoney(v.retailPrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatMoney(v.wholesalePrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatMoney(v.minimumPrice)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="secondary"
                    className={cn(
                      v.stockQuantity === 0 && "bg-red-100 text-red-800",
                    )}
                  >
                    {v.stockQuantity}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          itemName="variants"
        />
      )}

      <p className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-4">
        <span className="inline-flex items-center gap-1">
          <DollarSign className="size-3" />
          Adjust prices from the product list
        </span>
        <span className="inline-flex items-center gap-1">
          <Package className="size-3" />
          Adjust stock per warehouse from the list
        </span>
      </p>
    </div>
  );
}
