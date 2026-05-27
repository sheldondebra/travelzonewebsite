"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Boxes,
  ChevronRight,
  DollarSign,
  Eye,
  ImageIcon,
  Layers,
  Package,
  PackagePlus,
  Pencil,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { FilterPills } from "@/components/layout/filter-pills";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { StatCard } from "@/components/layout/stat-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { parseApiResponse } from "@/lib/api-client";
import { DEFAULT_PAGE_SIZE, type Paginated } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/ui/table-pagination";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import { PriceAdjustmentModal } from "@/components/products/price-adjustment-modal";
import { ManageStockModal } from "@/components/products/manage-stock-modal";
import type { CatalogItem, ProductRow } from "@/components/products/product-types";
import {
  displayRetailPrice,
  displayWholesalePrice,
} from "@/components/products/product-types";

const STOCK_FILTERS = [
  { value: "all", label: "All stock" },
  { value: "in", label: "In stock" },
  { value: "low", label: "Low" },
  { value: "out", label: "Out" },
];

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

export function ProductsList() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState(
    initialStatus === "all" || initialStatus === "inactive"
      ? initialStatus
      : "active",
  );
  const [priceProduct, setPriceProduct] = useState<ProductRow | null>(null);
  const [stockProduct, setStockProduct] = useState<ProductRow | null>(null);
  const [stockFilter, setStockFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, typeFilter, statusFilter, stockFilter]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/catalog/categories");
      return parseApiResponse<CatalogItem[]>(res);
    },
  });

  const queryKey = useMemo(
    () => ["products", search, categoryFilter, typeFilter, statusFilter, stockFilter, page],
    [search, categoryFilter, typeFilter, statusFilter, stockFilter, page],
  );

  const { data: stats } = useQuery({
    queryKey: ["product-stats"],
    queryFn: async () => {
      const res = await fetch("/api/products/stats");
      return parseApiResponse<{
        total: number;
        active: number;
        inactive: number;
        withImages: number;
        variable: number;
        simple: number;
        customers: number;
        orders: number;
        invalidImports: number;
      }>(res);
    },
  });

  const purgeGarbageMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/products/purge-garbage", { method: "POST" });
      return parseApiResponse<{ removed: number }>(res);
    },
    onSuccess: (data) => {
      toast.success(`Removed ${data.removed} invalid row(s)`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);
      if (typeFilter === "simple") params.set("type", "simple");
      if (typeFilter === "variable") params.set("type", "variable");
      if (statusFilter !== "active") params.set("status", statusFilter);
      if (stockFilter === "low") params.set("stock", "low");
      if (stockFilter === "out") params.set("stock", "out");
      if (stockFilter === "in") params.set("stock", "in");
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      const res = await fetch(`/api/products?${params}`);
      return parseApiResponse<Paginated<ProductRow>>(res);
    },
  });

  const products = data?.items ?? [];
  const total = data?.total ?? 0;

  const showPlatformStoreHint =
    session?.user?.role === "PLATFORM_ADMIN" &&
    !isLoading &&
    products.length === 0 &&
    (stats?.total ?? 0) === 0;

  const hasActiveFilters =
    search ||
    categoryFilter !== "all" ||
    typeFilter !== "all" ||
    statusFilter !== "active" ||
    stockFilter !== "all";

  function clearFilters() {
    setSearch("");
    setCategoryFilter("all");
    setTypeFilter("all");
    setStatusFilter("active");
    setStockFilter("all");
  }

  return (
    <PageShell size="wide">
      <PageHeader
        title="Products"
        description={
          stats
            ? `${stats.active} active · ${stats.total} total in catalog`
            : "Manage prices, stock, and variants"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/products/import"
              className={buttonVariants({ variant: "outline", className: "touch-manipulation" })}
            >
              <Upload className="mr-2 size-4" />
              Import
            </Link>
            <Link
              href="/dashboard/products/new"
              className={buttonVariants({ className: "touch-manipulation" })}
            >
              <PackagePlus className="mr-2 size-4" />
              Add product
            </Link>
          </div>
        }
      />

      {stats && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active"
            value={String(stats.active)}
            sub={`${stats.total} total`}
            icon={Boxes}
            highlight
          />
          <StatCard
            label="Variable"
            value={String(stats.variable)}
            sub="Multi-option products"
            icon={Layers}
            accent="blue"
          />
          <StatCard
            label="With images"
            value={String(stats.withImages)}
            sub="Has product photo"
            icon={ImageIcon}
            accent="green"
          />
          <StatCard
            label="Simple"
            value={String(stats.simple)}
            sub="Single price & stock"
            icon={Package}
          />
        </section>
      )}

      {stats && stats.invalidImports > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              <strong>{stats.invalidImports}</strong> invalid import row(s) detected.
              Use{" "}
              <Link
                href="/dashboard/products/database-import"
                className="font-medium underline underline-offset-2"
              >
                Database import
              </Link>{" "}
              for SQL dumps.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={purgeGarbageMutation.isPending}
            onClick={() => purgeGarbageMutation.mutate()}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            {purgeGarbageMutation.isPending ? "Removing…" : "Remove invalid"}
          </Button>
        </div>
      )}

      {stats && stats.inactive > 0 && statusFilter === "active" && (
        <p className="rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-2.5 text-sm text-amber-950">
          {stats.inactive} inactive product(s) hidden. Switch status to{" "}
          <strong>All</strong> to view.
        </p>
      )}

      {/* Toolbar */}
      <div className="space-y-3 rounded-2xl border border-gray-100/80 bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              className="h-10 rounded-xl border-gray-200/80 bg-brand-surface/50 pl-9 shadow-none focus-visible:bg-white"
              placeholder="Search name, SKU, barcode…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
              <SelectTrigger className="h-10 w-full rounded-xl sm:w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="simple">Normal</SelectItem>
                <SelectItem value="variable">Variable</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v ?? "active")}
            >
              <SelectTrigger className="h-10 w-full rounded-xl sm:w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="all">All status</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v ?? "all")}
            >
              <SelectTrigger className="h-10 w-full rounded-xl sm:w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 text-muted-foreground"
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <FilterPills
          options={STOCK_FILTERS}
          value={stockFilter}
          onChange={setStockFilter}
        />
      </div>

      {/* Table / list */}
      <div className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-gray-100/80 px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            {isLoading ? "Loading…" : `${total} products`}
          </p>
          {!isLoading && products.length > 0 && (
            <p className="hidden text-xs text-muted-foreground sm:block">
              Click a row to open details
            </p>
          )}
        </div>

        {isLoading ? (
          <ProductsTableSkeleton />
        ) : isError ? (
          <EmptyState
            title="Could not load products"
            message={
              error instanceof Error
                ? error.message
                : "Try refreshing. Platform admins: select Novasoria in Store context."
            }
          />
        ) : products.length === 0 ? (
          <div className="p-6">
            {showPlatformStoreHint ? (
              <EmptyState
                icon={Boxes}
                title="No catalog on this store"
                message="Switch Store context to Novasoria in the sidebar, or sign in as the store owner."
              />
            ) : (
              <EmptyState
                icon={Package}
                title="No products yet"
                message="Add your first product or import your legacy catalog."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link href="/dashboard/products/new" className={buttonVariants()}>
                      Add product
                    </Link>
                    <Link
                      href="/dashboard/products/database-import"
                      className={buttonVariants({ variant: "outline" })}
                    >
                      Database import
                    </Link>
                  </div>
                }
              />
            )}
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-gray-100 lg:hidden">
              {products.map((p) => (
                <ProductMobileRow
                  key={p.id}
                  product={p}
                  onOpen={() => router.push(`/dashboard/products/${p.id}`)}
                  onPrice={() => setPriceProduct(p)}
                  onStock={() => setStockProduct(p)}
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100/80 hover:bg-transparent">
                    <TableHead className="h-11 w-[72px] bg-muted/30 pl-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Product
                    </TableHead>
                    <TableHead className="h-11 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="h-11 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      SKU
                    </TableHead>
                    <TableHead className="h-11 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Type
                    </TableHead>
                    <TableHead className="h-11 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Category
                    </TableHead>
                    <TableHead className="h-11 bg-muted/30 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Selling
                    </TableHead>
                    <TableHead className="h-11 bg-muted/30 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Wholesale
                    </TableHead>
                    <TableHead className="h-11 bg-muted/30 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Stock
                    </TableHead>
                    <TableHead className="h-11 bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="h-11 w-[140px] bg-muted/30 pr-4 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <ProductTableRow
                      key={p.id}
                      product={p}
                      onOpen={() => router.push(`/dashboard/products/${p.id}`)}
                      onPrice={() => setPriceProduct(p)}
                      onStock={() => setStockProduct(p)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {!isLoading && products.length > 0 && (
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            itemName="products"
          />
        )}
      </div>

      <PriceAdjustmentModal
        product={priceProduct}
        open={!!priceProduct}
        onOpenChange={(open) => !open && setPriceProduct(null)}
      />
      <ManageStockModal
        product={stockProduct}
        open={!!stockProduct}
        onOpenChange={(open) => !open && setStockProduct(null)}
      />
    </PageShell>
  );
}

function ProductTableRow({
  product: p,
  onOpen,
  onPrice,
  onStock,
}: {
  product: ProductRow;
  onOpen: () => void;
  onPrice: () => void;
  onStock: () => void;
}) {
  const variantCount = p._count?.variants ?? p.variants?.length ?? 0;

  return (
    <TableRow
      className="group cursor-pointer border-gray-100/80 transition-colors hover:bg-muted/25"
      onClick={onOpen}
    >
      <TableCell className="py-3 pl-4">
        <ProductThumbnail
          imageUrl={p.imageUrl ?? p.variants?.[0]?.imageUrl}
          name={p.name}
          className="size-11 rounded-lg"
        />
      </TableCell>
      <TableCell className="max-w-[220px] py-3">
        <p className="truncate font-medium text-foreground">{p.name}</p>
        {p.productType === "VARIABLE" && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {variantCount} variant{variantCount === 1 ? "" : "s"}
          </p>
        )}
      </TableCell>
      <TableCell className="py-3 font-mono text-xs text-muted-foreground">
        {p.sku ?? "—"}
      </TableCell>
      <TableCell className="py-3">
        <TypeBadge type={p.productType} />
      </TableCell>
      <TableCell className="max-w-[140px] truncate py-3 text-sm text-muted-foreground">
        {p.categoryRef?.name ?? p.category ?? "—"}
      </TableCell>
      <TableCell className="py-3 text-right text-sm font-semibold tabular-nums">
        {displayRetailPrice(p)}
      </TableCell>
      <TableCell className="py-3 text-right text-sm tabular-nums text-muted-foreground">
        {displayWholesalePrice(p)}
      </TableCell>
      <TableCell className="py-3 text-right">
        <StockBadge quantity={p.stockQuantity} alert={p.stockAlert ?? 5} />
      </TableCell>
      <TableCell className="py-3">
        <StatusBadge active={p.isActive} />
      </TableCell>
      <TableCell className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
        <RowActions
          productId={p.id}
          onPrice={onPrice}
          onStock={onStock}
          className="justify-end opacity-60 transition-opacity group-hover:opacity-100"
        />
      </TableCell>
    </TableRow>
  );
}

function ProductMobileRow({
  product: p,
  onOpen,
  onPrice,
  onStock,
}: {
  product: ProductRow;
  onOpen: () => void;
  onPrice: () => void;
  onStock: () => void;
}) {
  return (
    <div className="flex gap-3 p-4 transition-colors active:bg-muted/30">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 text-left touch-manipulation"
        onClick={onOpen}
      >
        <ProductThumbnail
          imageUrl={p.imageUrl ?? p.variants?.[0]?.imageUrl}
          name={p.name}
          className="size-14 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 font-medium leading-snug">{p.name}</p>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {p.sku ?? "No SKU"} · {p.categoryRef?.name ?? p.category ?? "Uncategorized"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold tabular-nums">
              {displayRetailPrice(p)}
            </span>
            <TypeBadge type={p.productType} />
            <StockBadge quantity={p.stockQuantity} alert={p.stockAlert ?? 5} />
          </div>
        </div>
      </button>
      <div className="flex shrink-0 flex-col gap-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon-sm" onClick={onPrice} aria-label="Adjust price">
          <DollarSign className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onStock} aria-label="Manage stock">
          <Package className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function RowActions({
  productId,
  onPrice,
  onStock,
  className,
}: {
  productId: string;
  onPrice: () => void;
  onStock: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-xl border border-gray-100 bg-white p-0.5 shadow-card",
        className,
      )}
    >
      <Link
        href={`/dashboard/products/${productId}`}
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        title="View"
      >
        <Eye className="size-3.5" />
      </Link>
      <Button variant="ghost" size="icon-sm" title="Price" onClick={onPrice}>
        <DollarSign className="size-3.5" />
      </Button>
      <Button variant="ghost" size="icon-sm" title="Stock" onClick={onStock}>
        <Package className="size-3.5" />
      </Button>
      <Link
        href={`/dashboard/products/${productId}/edit`}
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        title="Edit"
      >
        <Pencil className="size-3.5" />
      </Link>
    </div>
  );
}

function TypeBadge({ type }: { type: ProductRow["productType"] }) {
  const variable = type === "VARIABLE";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
        variable
          ? "bg-violet-50 text-violet-700"
          : "bg-gray-100 text-gray-600",
      )}
    >
      {variable ? "Variable" : "Normal"}
    </span>
  );
}

function StockBadge({ quantity, alert }: { quantity: number; alert: number }) {
  const out = quantity === 0;
  const low = !out && quantity <= alert;
  return (
    <span
      className={cn(
        "inline-flex min-w-[2rem] items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
        out && "bg-red-50 text-red-700",
        low && "bg-amber-50 text-amber-800",
        !out && !low && "bg-emerald-50 text-emerald-700",
      )}
    >
      {quantity}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-gray-300",
        )}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function ProductsTableSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <div className="size-11 animate-pulse rounded-lg bg-muted/60" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-muted/60" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted/40" />
          </div>
          <div className="hidden h-4 w-16 animate-pulse rounded bg-muted/40 lg:block" />
          <div className="hidden h-4 w-20 animate-pulse rounded bg-muted/40 lg:block" />
        </div>
      ))}
    </div>
  );
}
