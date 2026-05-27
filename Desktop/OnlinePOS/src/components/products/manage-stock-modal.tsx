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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseApiResponse } from "@/lib/api-client";
import type { ProductRow } from "@/components/products/product-types";

type Warehouse = { id: string; name: string; isDefault: boolean };

export function ManageStockModal({
  product,
  open,
  onOpenChange,
}: {
  product: ProductRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [variantId, setVariantId] = useState("");

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const res = await fetch("/api/warehouses");
      return parseApiResponse<Warehouse[]>(res);
    },
    enabled: open,
  });

  const { data: variants = [] } = useQuery({
    queryKey: ["variants", product?.id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${product!.id}/variants`);
      return parseApiResponse<
        { id: string; name: string; stockQuantity: number }[]
      >(res);
    },
    enabled: open && product?.productType === "VARIABLE",
  });

  useEffect(() => {
    if (!product || !open) return;
    if (product.productType === "VARIABLE" && variants.length) {
      const v = variants[0]!;
      setVariantId(v.id);
      setQuantity(String(v.stockQuantity));
    } else {
      setQuantity(String(product.stockQuantity));
    }
    const def = warehouses.find((w) => w.isDefault) ?? warehouses[0];
    if (def) setWarehouseId(def.id);
  }, [product, open, variants, warehouses]);

  useEffect(() => {
    if (product?.productType === "VARIABLE" && variantId) {
      const v = variants.find((x) => x.id === variantId);
      if (v) setQuantity(String(v.stockQuantity));
    }
  }, [variantId, variants, product?.productType]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const isVariable = product!.productType === "VARIABLE";
      const url = isVariable
        ? `/api/product-variants/${variantId}/stock`
        : `/api/products/${product!.id}/stock`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(quantity),
          warehouseId: warehouseId || null,
          reason: reason || undefined,
        }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Stock updated");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage stock</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{product.name}</p>
        <div className="space-y-4">
          {product.productType === "VARIABLE" && (
            <div className="space-y-2">
              <Label>Variant</Label>
              <Select value={variantId} onValueChange={(v) => setVariantId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {variants.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} ({v.stockQuantity} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select
              value={warehouseId}
              onValueChange={(v) => setWarehouseId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>New stock quantity</Label>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Stock count correction"
            />
          </div>
          <Button
            className="w-full"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save stock
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
