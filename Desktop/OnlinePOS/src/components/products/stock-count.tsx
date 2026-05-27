"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { ProductRow } from "@/components/products/product-types";
import { TablePagination } from "@/components/ui/table-pagination";
import { useClientPagination } from "@/hooks/use-client-pagination";

export function StockCount() {
  const queryClient = useQueryClient();
  const [counts, setCounts] = useState<Record<string, string>>({});

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      return parseApiResponse<ProductRow[]>(res);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const items = products.map((p) => ({
        productId: p.id,
        countedQuantity: Number(counts[p.id] ?? p.stockQuantity),
      }));

      const res = await fetch("/api/products/stock-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      return parseApiResponse<{ adjusted: number }>(res);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`Adjusted ${data.adjusted} products`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const {
    page,
    setPage,
    items,
    total,
    pageSize,
  } = useClientPagination(products);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Count stock</h1>
        <p className="text-muted-foreground">
          Enter physical counts — system adjusts inventory automatically
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Counted</TableHead>
                  <TableHead>Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => {
                const counted = Number(counts[p.id] ?? p.stockQuantity);
                const variance = counted - p.stockQuantity;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.stockQuantity}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="w-28"
                        defaultValue={p.stockQuantity}
                        onChange={(e) =>
                          setCounts((c) => ({
                            ...c,
                            [p.id]: e.target.value,
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell
                      className={cn(
                        variance !== 0 && "font-medium text-amber-700",
                        variance < 0 && "text-red-700",
                        variance > 0 && "text-green-700",
                      )}
                    >
                      {counts[p.id] !== undefined
                        ? (variance > 0 ? "+" : "") + variance
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              </TableBody>
            </Table>
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              itemName="products"
            />
          </>
        )}
      </div>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending || products.length === 0}
      >
        {saveMutation.isPending ? "Saving..." : "Submit stock count"}
      </Button>
    </div>
  );
}
