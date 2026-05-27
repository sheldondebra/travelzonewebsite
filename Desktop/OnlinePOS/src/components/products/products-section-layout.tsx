"use client";

import { usePathname } from "next/navigation";
import { ProductsNav } from "@/components/products/products-nav";

export function ProductsSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const staticSegments = new Set([
    "new",
    "import",
    "categories",
    "sub-categories",
    "brands",
    "units",
    "warehouses",
    "stock-count",
    "opening-stock",
    "labels",
    "bulk-pricing",
    "database-import",
  ]);

  const detailMatch = pathname.match(/^\/dashboard\/products\/([^/]+)$/);
  const isProductDetail =
    detailMatch !== null && !staticSegments.has(detailMatch[1]);

  const isFocusedFlow =
    pathname === "/dashboard/products/new" ||
    /\/dashboard\/products\/[^/]+\/edit$/.test(pathname) ||
    isProductDetail;

  if (isFocusedFlow) {
    return <div className="min-w-0 flex-1">{children}</div>;
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
      <ProductsNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
