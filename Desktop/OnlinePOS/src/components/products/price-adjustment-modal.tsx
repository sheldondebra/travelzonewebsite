"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseApiResponse } from "@/lib/api-client";
import { validatePricing } from "@/lib/products/pricing";
import type { ProductRow } from "@/components/products/product-types";

type Props = {
  product: ProductRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function PricePair({
  label,
  current,
  value,
  onChange,
}: {
  label: string;
  current: number;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div>
        <Label className="text-xs text-muted-foreground">Current {label}</Label>
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">{current.toFixed(2)}</p>
      </div>
      <div className="space-y-1">
        <Label>New {label}</Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

export function PriceAdjustmentModal({ product, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [cost, setCost] = useState("");
  const [retail, setRetail] = useState("");
  const [wholesale, setWholesale] = useState("");
  const [minimum, setMinimum] = useState("");
  const [reason, setReason] = useState("");
  const [variantRows, setVariantRows] = useState<
    Record<string, { cost: string; retail: string; wholesale: string; minimum: string }>
  >({});

  const { data: variants = [] } = useQuery({
    queryKey: ["variants", product?.id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${product!.id}/variants`);
      return parseApiResponse<
        {
          id: string;
          name: string;
          costPrice: number;
          retailPrice: number;
          wholesalePrice: number;
          minimumPrice: number;
        }[]
      >(res);
    },
    enabled: open && !!product && product.productType === "VARIABLE",
  });

  useEffect(() => {
    if (!product || !open) return;
    if (product.productType === "SIMPLE") {
      setCost(String(product.costPrice));
      setRetail(String(product.price));
      setWholesale(String(product.wholesalePrice));
      setMinimum(String(product.minimumPrice));
    }
  }, [product, open]);

  useEffect(() => {
    if (variants.length) {
      const rows: typeof variantRows = {};
      for (const v of variants) {
        rows[v.id] = {
          cost: String(v.costPrice),
          retail: String(v.retailPrice),
          wholesale: String(v.wholesalePrice),
          minimum: String(v.minimumPrice),
        };
      }
      setVariantRows(rows);
    }
  }, [variants]);

  const saveSimple = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${product!.id}/adjust-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          costPrice: Number(cost),
          retailPrice: Number(retail),
          wholesalePrice: Number(wholesale),
          minimumPrice: Number(minimum),
          reason: reason || undefined,
        }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Price updated successfully.");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function saveVariants() {
    for (const v of variants) {
      const row = variantRows[v.id];
      if (!row) continue;
      const res = await fetch(`/api/product-variants/${v.id}/adjust-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          costPrice: Number(row.cost),
          retailPrice: Number(row.retail),
          wholesalePrice: Number(row.wholesale),
          minimumPrice: Number(row.minimum),
          reason: reason || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        toast.error(j.message ?? "Failed to update variant");
        return;
      }
    }
    queryClient.invalidateQueries({ queryKey: ["products"] });
    toast.success("Price updated successfully.");
    onOpenChange(false);
  }

  function applyBulkRetail(percent?: number, fixed?: number) {
    setVariantRows((prev) => {
      const next = { ...prev };
      for (const v of variants) {
        const current = Number(prev[v.id]?.retail ?? v.retailPrice);
        let nv = current;
        if (percent !== undefined) nv = Math.round(current * (1 + percent / 100) * 100) / 100;
        if (fixed !== undefined) nv = Math.round((current + fixed) * 100) / 100;
        next[v.id] = { ...next[v.id], retail: String(nv) };
      }
      return next;
    });
  }

  if (!product) return null;

  const simpleValidation = validatePricing({
    costPrice: Number(cost),
    retailPrice: Number(retail),
    wholesalePrice: Number(wholesale),
    minimumPrice: Number(minimum),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adjust product price</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{product.name}</p>

        {product.productType === "SIMPLE" ? (
          <div className="space-y-4">
            <PricePair label="buying price" current={product.costPrice} value={cost} onChange={setCost} />
            <PricePair label="selling price" current={product.price} value={retail} onChange={setRetail} />
            <PricePair label="wholesale price" current={product.wholesalePrice} value={wholesale} onChange={setWholesale} />
            <PricePair label="lowest allowed price" current={product.minimumPrice} value={minimum} onChange={setMinimum} />
            {simpleValidation.warnings.map((w) => (
              <p key={w} className="text-sm text-amber-700">{w}</p>
            ))}
            {simpleValidation.errors.map((e) => (
              <p key={e} className="text-sm text-destructive">{e}</p>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => applyBulkRetail(10)}>
                +10% all selling
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => applyBulkRetail(undefined, 5)}>
                +5 fixed all selling
              </Button>
            </div>
            <div className="space-y-3">
              {variants.map((v) => (
                <div key={v.id} className="rounded-xl border p-3">
                  <p className="mb-2 font-medium">{v.name}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(["cost", "retail", "wholesale", "minimum"] as const).map((field) => (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs capitalize">{field}</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={variantRows[v.id]?.[field] ?? ""}
                          onChange={(e) =>
                            setVariantRows((prev) => ({
                              ...prev,
                              [v.id]: { ...prev[v.id], [field]: e.target.value },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Reason for change (optional)</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        <Button
          className="w-full"
          disabled={saveSimple.isPending}
          onClick={() =>
            product.productType === "SIMPLE"
              ? saveSimple.mutate()
              : saveVariants()
          }
        >
          Save prices
        </Button>
      </DialogContent>
    </Dialog>
  );
}
