"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Barcode,
  Boxes,
  Copy,
  DollarSign,
  ExternalLink,
  Layers,
  Package,
  Pencil,
  Store,
  Tag,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { StatCard } from "@/components/layout/stat-card";
import { useBusinessSettings } from "@/components/settings/business-settings-provider";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { ProductDeleteDialog } from "@/components/products/product-delete-dialog";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import { ProductVariantsEditor } from "@/components/products/product-variants-editor";
import { ManageStockModal } from "@/components/products/manage-stock-modal";
import { PriceAdjustmentModal } from "@/components/products/price-adjustment-modal";
import type { ProductRow } from "@/components/products/product-types";
import {
  displayRetailPrice,
  displayWholesalePrice,
} from "@/components/products/product-types";

function copyText(label: string, value: string) {
  void navigator.clipboard.writeText(value);
  toast.success(`${label} copied`);
}

function MetaField({
  icon: Icon,
  label,
  value,
  copyValue,
}: {
  icon: typeof Tag;
  label: string;
  value: React.ReactNode;
  copyValue?: string;
}) {
  return (
    <div className="group flex items-start gap-3 rounded-xl px-1 py-2.5 transition-colors hover:bg-muted/30">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
        <Icon className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{value}</p>
          {copyValue && (
            <button
              type="button"
              onClick={() => copyText(label, copyValue)}
              className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
              aria-label={`Copy ${label}`}
            >
              <Copy className="size-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        highlight
          ? "border-primary/20 bg-gradient-to-br from-brand-cream/80 to-brand-rose/40 shadow-soft"
          : "border-gray-100/80 bg-white",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-bold tabular-nums tracking-tight",
          highlight && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <PageShell className="pb-24 lg:pb-8">
      <div className="h-5 w-32 animate-pulse rounded-lg bg-muted/60" />
      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:p-8">
          <div className="mx-auto size-56 animate-pulse rounded-2xl bg-muted/50 lg:mx-0" />
          <div className="flex-1 space-y-4">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-16 animate-pulse rounded-full bg-muted/50" />
              ))}
            </div>
            <div className="h-9 w-3/4 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted/60" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/40" />
        ))}
      </div>
    </PageShell>
  );
}

export function ProductDetails({ productId }: { productId: string }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const { formatMoney } = useBusinessSettings();

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      return parseApiResponse<ProductRow>(res);
    },
  });

  const { data: business } = useQuery({
    queryKey: ["business"],
    queryFn: async () => {
      const res = await fetch("/api/business");
      return parseApiResponse<{ slug: string }>(res);
    },
    enabled: !!product?.isPublic,
  });

  if (isLoading) return <ProductDetailSkeleton />;

  if (isError || !product) {
    return (
      <PageShell>
        <Card className="border-destructive/30 bg-destructive/5 shadow-card">
          <CardContent className="py-16 text-center">
            <p className="font-medium text-destructive">
              {error instanceof Error ? error.message : "Product not found"}
            </p>
            <Link
              href="/dashboard/products"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}
            >
              Back to products
            </Link>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const isVariable = product.productType === "VARIABLE";
  const stockLow = product.stockQuantity <= (product.stockAlert ?? 5);
  const stockOut = product.stockQuantity === 0;
  const variantCount = product.variants?.length ?? product._count?.variants ?? 0;
  const margin =
    !isVariable && product.price > 0
      ? (((product.price - product.costPrice) / product.price) * 100).toFixed(1)
      : null;

  const retailDisplay = isVariable
    ? (() => {
        if (product.variants?.length) {
          const prices = product.variants.map((v) => v.retailPrice);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          return min === max
            ? formatMoney(min)
            : `${formatMoney(min)} – ${formatMoney(max)}`;
        }
        return displayRetailPrice(product);
      })()
    : formatMoney(product.price);

  const wholesaleDisplay = isVariable
    ? (() => {
        if (product.variants?.length) {
          const prices = product.variants.map((v) => v.wholesalePrice);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          return min === max
            ? formatMoney(min)
            : `${formatMoney(min)} – ${formatMoney(max)}`;
        }
        return displayWholesalePrice(product);
      })()
    : formatMoney(product.wholesalePrice);

  const identifierLine = [product.sku && `SKU ${product.sku}`, product.barcode && `Barcode ${product.barcode}`]
    .filter(Boolean)
    .join(" · ");

  const headerActions = (
    <>
      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setPriceOpen(true)}>
        <DollarSign className="mr-1.5 size-4" />
        Adjust price
      </Button>
      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setStockOpen(true)}>
        <Package className="mr-1.5 size-4" />
        Stock
      </Button>
      <Link
        href={`/dashboard/products/${productId}/edit`}
        className={buttonVariants({ size: "sm", className: "rounded-xl" })}
      >
        <Pencil className="mr-1.5 size-4" />
        Edit
      </Link>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="mr-1.5 size-4" />
        Delete
      </Button>
    </>
  );

  return (
    <PageShell className="pb-24 lg:pb-8">
      {/* Top nav */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard/products"
          className="inline-flex w-fit items-center gap-1.5 rounded-lg px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Products
        </Link>
        <div className="hidden flex-wrap gap-2 sm:flex">{headerActions}</div>
      </div>

      {/* Hero */}
      <Card className="mt-4 overflow-hidden border-gray-100/80 shadow-card">
        <CardContent className="p-0">
          <div className="grid gap-0 lg:grid-cols-[minmax(240px,320px)_1fr]">
            <div className="relative flex items-center justify-center bg-gradient-to-br from-brand-cream via-white to-brand-rose/30 p-6 lg:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(248,187,208,0.15),transparent_50%)]" />
              <ProductThumbnail
                imageUrl={product.imageUrl ?? product.variants?.[0]?.imageUrl}
                name={product.name}
                sizes="(max-width: 768px) 208px, 256px"
                className="relative z-10 size-52 rounded-2xl shadow-elevated ring-1 ring-black/5 sm:size-56 lg:size-64"
              />
            </div>

            <div className="flex flex-col justify-center gap-5 border-t border-gray-100/80 p-6 lg:border-t-0 lg:border-l lg:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={product.isActive ? "default" : "outline"}
                  className="rounded-full px-2.5"
                >
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="secondary" className="rounded-full px-2.5">
                  {isVariable ? "Variable" : "Simple"}
                </Badge>
                {product.isPublic && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-200/80 bg-emerald-50/80 px-2.5 text-emerald-800"
                  >
                    <Store className="mr-1 size-3" />
                    Storefront
                  </Badge>
                )}
                {stockOut && (
                  <Badge className="rounded-full bg-red-100 px-2.5 text-red-800 hover:bg-red-100">
                    Out of stock
                  </Badge>
                )}
                {!stockOut && stockLow && (
                  <Badge className="rounded-full bg-amber-100 px-2.5 text-amber-900 hover:bg-amber-100">
                    Low stock
                  </Badge>
                )}
              </div>

              <div>
                <h1 className="font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                  {product.name}
                </h1>
                {identifierLine && (
                  <p className="mt-2 text-sm text-muted-foreground">{identifierLine}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <PriceChip label="Retail" value={retailDisplay} highlight />
                <PriceChip label="Wholesale" value={wholesaleDisplay} />
                {!isVariable && (
                  <>
                    <PriceChip label="Cost" value={formatMoney(product.costPrice)} />
                    <PriceChip label="Min price" value={formatMoney(product.minimumPrice)} />
                  </>
                )}
                {isVariable && (
                  <PriceChip
                    label="Variants"
                    value={String(variantCount)}
                  />
                )}
              </div>

              {product.description ? (
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground/70">
                  No description — add one when editing this product.
                </p>
              )}

              {product.isPublic && business?.slug && product.slug && (
                <Link
                  href={`/store/${business.slug}/product/${product.slug}`}
                  target="_blank"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "w-fit gap-2 rounded-xl",
                  })}
                >
                  <ExternalLink className="size-4" />
                  View on storefront
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Retail"
          value={retailDisplay}
          icon={DollarSign}
          highlight
        />
        <StatCard
          label="Wholesale"
          value={wholesaleDisplay}
          icon={Tag}
          accent="blue"
        />
        <StatCard
          label="In stock"
          value={String(product.stockQuantity)}
          sub={
            stockOut
              ? "Restock needed"
              : stockLow
                ? `Alert at ${product.stockAlert}`
                : `${product.stockAlert} alert threshold`
          }
          icon={Boxes}
          accent={stockOut ? "amber" : stockLow ? "amber" : "green"}
        />
        <StatCard
          label={isVariable ? "Variants" : "Margin"}
          value={isVariable ? String(variantCount) : margin ? `${margin}%` : "—"}
          sub={
            isVariable
              ? "Individual SKUs"
              : margin
                ? `Cost ${formatMoney(product.costPrice)}`
                : undefined
          }
          icon={isVariable ? Layers : TrendingUp}
        />
      </section>

      {/* Main content */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {!isVariable && (
            <Card className="border-gray-100/80 shadow-card">
              <CardHeader className="border-b border-gray-50 pb-4">
                <CardTitle className="text-base font-semibold">Pricing breakdown</CardTitle>
                <CardDescription>
                  Cost, floor, wholesale, and retail — margin {margin ? `${margin}%` : "—"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Cost price", value: formatMoney(product.costPrice) },
                    { label: "Minimum price", value: formatMoney(product.minimumPrice) },
                    { label: "Wholesale", value: formatMoney(product.wholesalePrice) },
                    { label: "Retail", value: formatMoney(product.price), highlight: true },
                    ...(product.compareAtPrice != null && product.compareAtPrice > 0
                      ? [{ label: "Compare at", value: formatMoney(product.compareAtPrice) }]
                      : []),
                  ].map((row) => (
                    <div
                      key={row.label}
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-4 py-3",
                        "highlight" in row && row.highlight
                          ? "border-primary/15 bg-brand-cream/40"
                          : "border-gray-100/80 bg-muted/20",
                      )}
                    >
                      <span className="text-sm text-muted-foreground">{row.label}</span>
                      <span className="text-sm font-semibold tabular-nums">{row.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isVariable && (
            <Card className="border-gray-100/80 shadow-card">
              <CardHeader className="border-b border-gray-50 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Layers className="size-4 text-primary" />
                  Variants
                </CardTitle>
                <CardDescription>
                  {variantCount} variant{variantCount === 1 ? "" : "s"} with individual pricing and stock
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <ProductVariantsEditor
                  productId={productId}
                  productName={product.name}
                  formatMoney={formatMoney}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="border-gray-100/80 shadow-card">
            <CardHeader className="border-b border-gray-50 pb-3">
              <CardTitle className="text-base font-semibold">Catalog</CardTitle>
              <CardDescription>How this product is organized</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0.5 pt-2">
              <MetaField
                icon={Tag}
                label="Category"
                value={product.categoryRef?.name ?? product.category ?? "—"}
              />
              <MetaField
                icon={Layers}
                label="Subcategory"
                value={product.subCategoryRef?.name ?? product.subCategory ?? "—"}
              />
              <MetaField
                icon={Store}
                label="Brand"
                value={product.brandRef?.name ?? product.brand ?? "—"}
              />
              <MetaField
                icon={Package}
                label="Unit"
                value={
                  product.unitRef
                    ? `${product.unitRef.name}${product.unitRef.abbreviation ? ` (${product.unitRef.abbreviation})` : ""}`
                    : (product.unit ?? "—")
                }
              />
            </CardContent>
          </Card>

          <Card className="border-gray-100/80 shadow-card">
            <CardHeader className="border-b border-gray-50 pb-3">
              <CardTitle className="text-base font-semibold">Inventory</CardTitle>
              <CardDescription>Stock levels and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0.5 pt-2">
              <MetaField
                icon={Boxes}
                label="Quantity on hand"
                value={
                  <span
                    className={cn(
                      stockOut && "text-red-600",
                      !stockOut && stockLow && "text-amber-700",
                    )}
                  >
                    {product.stockQuantity}
                  </span>
                }
              />
              <MetaField
                icon={TrendingUp}
                label="Low stock alert"
                value={product.stockAlert}
              />
            </CardContent>
          </Card>

          <Card className="border-gray-100/80 shadow-card">
            <CardHeader className="border-b border-gray-50 pb-3">
              <CardTitle className="text-base font-semibold">Identifiers</CardTitle>
              <CardDescription>SKU and barcode for scanning</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0.5 pt-2">
              <MetaField
                icon={Barcode}
                label="SKU"
                value={product.sku ?? "—"}
                copyValue={product.sku ?? undefined}
              />
              <MetaField
                icon={Barcode}
                label="Barcode"
                value={product.barcode ?? "—"}
                copyValue={product.barcode ?? undefined}
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-100/80 bg-white/95 p-3 backdrop-blur-md safe-bottom sm:hidden">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => setStockOpen(true)}
          >
            <Package className="mr-1.5 size-4" />
            Stock
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => setPriceOpen(true)}
          >
            <DollarSign className="mr-1.5 size-4" />
            Price
          </Button>
          <Link
            href={`/dashboard/products/${productId}/edit`}
            className={buttonVariants({ className: "flex-1 rounded-xl" })}
          >
            <Pencil className="mr-1.5 size-4" />
            Edit
          </Link>
        </div>
      </div>

      <ProductDeleteDialog
        productId={productId}
        productName={product.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
      <ManageStockModal product={product} open={stockOpen} onOpenChange={setStockOpen} />
      <PriceAdjustmentModal product={product} open={priceOpen} onOpenChange={setPriceOpen} />
    </PageShell>
  );
}
