import { Suspense } from "react";
import { ProductsList } from "@/components/products/products-list";

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsList />
    </Suspense>
  );
}

function ProductsPageSkeleton() {
  return (
    <div className="page-container mx-auto max-w-7xl space-y-6">
      <div className="space-y-2 border-b border-gray-100/80 pb-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted/60" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted/40" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
        ))}
      </div>
      <div className="h-28 animate-pulse rounded-2xl bg-muted/30" />
      <div className="h-96 animate-pulse rounded-2xl bg-muted/20" />
    </div>
  );
}
