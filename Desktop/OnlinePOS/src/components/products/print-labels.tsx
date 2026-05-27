"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { ProductRow } from "@/components/products/product-types";

export function PrintLabels() {
  const printRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      return parseApiResponse<ProductRow[]>(res);
    },
  });

  const selectedProducts = products.filter((p) => selected.has(p.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function print() {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Labels</title>
      <style>
        body { font-family: "Plus Jakarta Sans", sans-serif; margin: 16px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .label { border: 1px dashed #ccc; padding: 12px; border-radius: 8px; }
        .name { font-weight: 600; font-size: 14px; }
        .meta { font-size: 11px; color: #666; margin-top: 4px; }
        .price { font-size: 16px; margin-top: 8px; color: #c2185b; }
        .barcode { font-family: monospace; letter-spacing: 2px; margin-top: 6px; }
      </style></head><body>
      <div class="grid">${html}</div>
      <script>window.onload = () => { window.print(); window.close(); }</script>
      </body></html>
    `);
    w.document.close();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Print labels</h1>
          <p className="text-muted-foreground">
            Select products to print name, price, SKU, and barcode labels
          </p>
        </div>
        <Button
          onClick={print}
          disabled={selectedProducts.length === 0}
        >
          <Printer className="mr-2 size-4" />
          Print {selectedProducts.length || ""} labels
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.id)}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              selected.has(p.id)
                ? "border-primary bg-brand-rose/40 shadow-soft"
                : "border-gray-100 bg-white hover:border-primary/30",
            )}
          >
            <p className="font-medium">{p.name}</p>
            <p className="text-sm text-primary">{p.price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {p.sku ?? "No SKU"}
            </p>
          </button>
        ))}
      </div>

      <div ref={printRef} className="hidden">
        {selectedProducts.map((p) => (
          <div key={p.id} className="label">
            <div className="name">{p.name}</div>
            <div className="meta">{p.brand ?? ""}</div>
            <div className="price">{p.price.toFixed(2)}</div>
            {p.sku && <div className="meta">SKU: {p.sku}</div>}
            {p.barcode && <div className="barcode">{p.barcode}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
