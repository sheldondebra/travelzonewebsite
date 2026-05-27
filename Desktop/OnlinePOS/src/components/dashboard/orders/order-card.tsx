"use client";

import { format } from "date-fns";
import { Calendar, ChevronRight, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { paymentStatusMeta } from "@/components/dashboard/orders/orders-styles";
import { deliveryStatusMeta } from "@/lib/orders/delivery";
import { orderItemsDisplay, orderRef } from "@/lib/orders/format";
import { cn } from "@/lib/utils";

export type OrderCardItem = {
  id: string;
  reference: string | null;
  totalAmount: number;
  paymentStatus: string;
  deliveryStatus: string;
  paymentMethod: string | null;
  createdAt: string;
  customer: { name: string };
  items: { quantity: number; product: { name: string } }[];
};

type Props = {
  order: OrderCardItem;
  formatMoney: (n: number) => string;
  onOpen: () => void;
};

export function OrderCard({ order, formatMoney, onOpen }: Props) {
  const payment = paymentStatusMeta(order.paymentStatus);
  const delivery = deliveryStatusMeta(order.deliveryStatus);
  const PaymentIcon = payment.icon;
  const sold = orderItemsDisplay(order.items);
  const date = format(new Date(order.createdAt), "MMM d, yyyy");
  const time = format(new Date(order.createdAt), "h:mm a");

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border border-primary/10 bg-white/95 text-left shadow-card transition-all touch-manipulation",
        "hover:border-primary/25 hover:shadow-soft",
        "border-l-4",
        payment.border,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-cream/30 via-transparent to-brand-rose/20 opacity-0 transition-opacity group-hover:opacity-100"
      />

      <div className="relative p-4 sm:p-5">
        <div className="flex gap-3 sm:gap-4">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm sm:size-12",
              payment.iconBg,
            )}
          >
            <PaymentIcon className="size-5 sm:size-[1.35rem]" strokeWidth={1.75} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-snug tracking-tight sm:text-base">
                  {orderRef(order)}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                  <User className="size-3.5 shrink-0" />
                  {order.customer.name}
                </p>
              </div>
              <span className="shrink-0 text-right">
                <span className="block text-lg font-bold tabular-nums text-foreground sm:text-xl">
                  {formatMoney(order.totalAmount)}
                </span>
                {order.paymentMethod && (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {order.paymentMethod.replace(/_/g, " ")}
                  </span>
                )}
              </span>
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-foreground/90">{sold.headline}</p>
            {sold.detail && (
              <p className="mt-0.5 text-xs text-muted-foreground">{sold.detail}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-full border-0 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                  payment.badge,
                )}
              >
                <span className={cn("mr-1.5 inline-block size-1.5 rounded-full", payment.dot)} />
                {payment.label}
              </Badge>
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-full border-0 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                  delivery.badge,
                )}
              >
                <span className={cn("mr-1 inline-block size-1.5 rounded-full", delivery.dot)} />
                {delivery.label}
              </Badge>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3" />
                  {date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  {time}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                View
                <ChevronRight className="size-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="h-44 animate-pulse rounded-2xl bg-gradient-to-br from-brand-cream/80 to-brand-rose/30" />
  );
}
