"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type SearchResults = {
  products: { id: string; name: string }[];
  customers: { id: string; name: string }[];
  orders: { id: string; customer: { name: string } }[];
};

type Props = {
  onNavigate?: () => void;
  compact?: boolean;
};

export function GlobalSearch({ onNavigate, compact }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);

  async function handleSearch(value: string) {
    setQ(value);
    if (value.length < 2) {
      setResults(null);
      return;
    }
    const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
    const data = await parseApiResponse<SearchResults>(res);
    setResults(data);
  }

  return (
    <div className={cn("relative", !compact && "mb-4")}>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
      <Input
        className={cn(
          "rounded-xl border-gray-200/80 bg-white pl-9 shadow-card placeholder:text-muted-foreground/70",
          compact && "h-10 text-sm",
        )}
        placeholder="Search anything…"
        value={q}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {results && q.length >= 2 && (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-elevated">
          {results.products.length > 0 && (
            <div className="border-b border-gray-50 p-1.5">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Products
              </p>
              {results.products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="block w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/60"
                  onClick={() => {
                    router.push("/dashboard/products");
                    setResults(null);
                    setQ("");
                    onNavigate?.();
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
          {results.customers.length > 0 && (
            <div className="border-b border-gray-50 p-1.5">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Customers
              </p>
              {results.customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="block w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/60"
                  onClick={() => {
                    router.push("/dashboard/people/customers");
                    setResults(null);
                    setQ("");
                    onNavigate?.();
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
          {results.orders.length > 0 && (
            <div className="p-1.5">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Orders
              </p>
              {results.orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className="block w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/60"
                  onClick={() => {
                    router.push(`/dashboard/orders/${o.id}/receipt`);
                    setResults(null);
                    setQ("");
                    onNavigate?.();
                  }}
                >
                  {o.customer.name}
                </button>
              ))}
            </div>
          )}
          {!results.products.length &&
            !results.customers.length &&
            !results.orders.length && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                No results found
              </p>
            )}
        </div>
      )}
    </div>
  );
}
