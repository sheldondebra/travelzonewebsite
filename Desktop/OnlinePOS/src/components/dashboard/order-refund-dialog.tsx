"use client";

import { useMemo, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseApiResponse } from "@/lib/api-client";
import { capitalizeLabel } from "@/lib/format-label";

type RefundableItem = {
  id: string;
  quantity: number;
  price: number;
  lineLabel: string | null;
  product: { name: string; sku: string | null };
  variant: { name: string } | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderRef: string;
  items: RefundableItem[];
  saleStatus?: string | null;
  onSuccess?: () => void;
};

function lineName(item: RefundableItem) {
  return item.lineLabel ?? item.product.name;
}

export function OrderRefundDialog({
  open,
  onOpenChange,
  orderId,
  orderRef,
  items,
  saleStatus,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [qtyByItem, setQtyByItem] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const disabled =
    saleStatus === "VOIDED" ||
    saleStatus === "REFUNDED" ||
    items.length === 0;

  const selectedLines = useMemo(
    () =>
      items
        .filter((item) => (qtyByItem[item.id] ?? 0) > 0)
        .map((item) => ({
          orderItemId: item.id,
          quantity: qtyByItem[item.id] ?? 0,
        })),
    [items, qtyByItem],
  );

  const refundTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (qtyByItem[item.id] ?? 0) * item.price,
        0,
      ),
    [items, qtyByItem],
  );

  function resetQty() {
    setQtyByItem(Object.fromEntries(items.map((i) => [i.id, 0])));
  }

  async function submitRefund(action: "refund" | "void") {
    setLoading(true);
    try {
      const res = await fetch("/api/pos/sales/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          action,
          reason: reason.trim() || undefined,
          lines: action === "refund" ? selectedLines : undefined,
        }),
      });
      await parseApiResponse(res);
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(action === "void" ? "Sale voided" : "Refund processed");
      onOpenChange(false);
      resetQty();
      setReason("");
      onSuccess?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Refund failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetQty();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{capitalizeLabel("Refund items")}</DialogTitle>
          <DialogDescription>
            {capitalizeLabel(
              `Order ${orderRef} — select quantities to return and restock`,
            )}
          </DialogDescription>
        </DialogHeader>

        {disabled ? (
          <p className="text-sm text-muted-foreground">
            This order cannot be refunded.
          </p>
        ) : (
          <div className="space-y-4">
            <ul className="space-y-2">
              {items.map((item) => {
                const qty = qtyByItem[item.id] ?? 0;
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-gray-100 bg-brand-cream/30 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium leading-snug">{lineName(item)}</p>
                        {item.variant && (
                          <p className="text-xs text-muted-foreground">
                            {item.variant.name}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Sold {item.quantity} · ₵{item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="size-8 rounded-lg"
                          disabled={qty <= 0}
                          onClick={() =>
                            setQtyByItem((prev) => ({
                              ...prev,
                              [item.id]: Math.max(0, qty - 1),
                            }))
                          }
                        >
                          −
                        </Button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">
                          {qty}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="size-8 rounded-lg"
                          disabled={qty >= item.quantity}
                          onClick={() =>
                            setQtyByItem((prev) => ({
                              ...prev,
                              [item.id]: Math.min(item.quantity, qty + 1),
                            }))
                          }
                        >
                          +
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() =>
                            setQtyByItem((prev) => ({
                              ...prev,
                              [item.id]: item.quantity,
                            }))
                          }
                        >
                          Max
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div>
              <Label htmlFor="refund-reason">
                {capitalizeLabel("Reason (optional)")}
              </Label>
              <Input
                id="refund-reason"
                className="mt-1.5 rounded-xl"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={capitalizeLabel("Damaged, wrong item, etc.")}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
              <span>{capitalizeLabel("Refund total")}</span>
              <span className="font-bold tabular-nums">₵{refundTotal.toFixed(2)}</span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1 rounded-xl"
                disabled={loading || selectedLines.length === 0}
                onClick={() => void submitRefund("refund")}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  capitalizeLabel("Refund selected")
                )}
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl"
                disabled={loading}
                onClick={() => void submitRefund("void")}
              >
                <RotateCcw className="mr-2 size-4" />
                {capitalizeLabel("Void entire sale")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
