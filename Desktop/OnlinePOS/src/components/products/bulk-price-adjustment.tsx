"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseApiResponse } from "@/lib/api-client";
import type { CatalogItem } from "@/components/products/product-types";

const methods = [
  { value: "retail_percent_up", label: "Increase selling price by %" },
  { value: "retail_percent_down", label: "Decrease selling price by %" },
  { value: "retail_fixed_up", label: "Increase selling price by amount" },
  { value: "retail_fixed_down", label: "Decrease selling price by amount" },
  { value: "set_wholesale", label: "Set wholesale price" },
  { value: "set_minimum", label: "Set lowest allowed price" },
] as const;

export function BulkPriceAdjustment() {
  const [categoryId, setCategoryId] = useState("all");
  const [method, setMethod] = useState<(typeof methods)[number]["value"]>("retail_percent_up");
  const [value, setValue] = useState("10");
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<
    { id: string; name: string; oldRetail: number; newRetail: number }[] | null
  >(null);
  const [pendingCount, setPendingCount] = useState(0);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/catalog/categories");
      return parseApiResponse<CatalogItem[]>(res);
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/products/bulk-adjust-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: categoryId === "all" ? undefined : categoryId,
          method,
          value: Number(value),
          reason: reason || "Bulk adjustment",
        }),
      });
      return parseApiResponse<{
        updated: number;
        preview: { id: string; name: string; oldRetail: number; newRetail: number }[];
      }>(res);
    },
    onSuccess: (data) => {
      setPreview(data.preview);
      setPendingCount(data.updated);
      toast.success(`Updated ${data.updated} products`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Bulk price adjustment</h1>
        <p className="text-muted-foreground">
          Update many normal products at once. Changes are recorded in price history.
        </p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Adjustment settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Category (optional)</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
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
          </div>
          <div className="space-y-2">
            <Label>Method</Label>
            <Select
              value={method}
              onValueChange={(v) =>
                setMethod((v as (typeof methods)[number]["value"]) ?? method)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <Button
            className="w-full"
            disabled={previewMutation.isPending}
            onClick={() => previewMutation.mutate()}
          >
            Apply to simple products
          </Button>
          {pendingCount > 0 && (
            <p className="text-sm text-muted-foreground">
              You updated prices for {pendingCount} products. This action was recorded
              in price history.
            </p>
          )}
        </CardContent>
      </Card>

      {preview && preview.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Preview (sample)</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Old</th>
                  <th className="pb-2">New</th>
                  <th className="pb-2">Diff</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-2">{row.name}</td>
                    <td>{row.oldRetail.toFixed(2)}</td>
                    <td>{row.newRetail.toFixed(2)}</td>
                    <td>{(row.newRetail - row.oldRetail).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
