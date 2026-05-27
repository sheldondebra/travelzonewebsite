"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Mail,
  Package,
  Phone,
  Receipt,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { OrderDeliverySection } from "@/components/dashboard/orders/order-delivery-section";
import { OrderItemsSold } from "@/components/dashboard/orders/order-items-sold";
import { paymentStatusMeta } from "@/components/dashboard/orders/orders-styles";
import { OrderRefundDialog } from "@/components/dashboard/order-refund-dialog";
import { PageShell } from "@/components/layout/page-shell";
import { useBusinessSettings } from "@/components/settings/business-settings-provider";
import { parseApiResponse } from "@/lib/api-client";
import { deliveryStatusMeta } from "@/lib/orders/delivery";
import {
  formatPaymentStatus,
  itemCountSummary,
  orderItemsDisplay,
  orderRef,
  summarizeOrderItems,
} from "@/lib/orders/format";
import { cn } from "@/lib/utils";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  lineTotal: number | null;
  lineLabel: string | null;
  product: { name: string; sku: string | null; imageUrl?: string | null };
  variant: { name: string } | null;
};

type OrderDetail = {
  id: string;
  reference: string | null;
  totalAmount: number;
  profit: number;
  amountPaid: number;
  changeDue?: number;
  paymentStatus: string;
  deliveryStatus: string;
  saleStatus?: string | null;
  paymentMethod: string | null;
  momoReference: string | null;
  notes: string | null;
  legacyMeta: unknown;
  createdAt: string;
  customer: { name: string; phone: string | null; email: string | null };
  items: OrderItem[];
  cashier?: { id: string; name: string | null } | null;
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-primary/5 py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  iconTone,
  children,
}: {
  title: string;
  description?: string;
  icon: typeof User;
  iconTone: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card">
      <div className="flex items-start gap-3 border-b border-primary/10 bg-gradient-to-r from-brand-cream/40 to-brand-rose/20 px-4 py-4 sm:px-5">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            iconTone,
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function OrderDetailView() {
  const params = useParams();
  const orderId = params.id as string;
  const { formatMoney } = useBusinessSettings();
  const [refundOpen, setRefundOpen] = useState(false);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      return parseApiResponse<OrderDetail>(res);
    },
  });

  const statTiles = useMemo(() => {
    if (!order) return [];
    const balanceDue = Math.max(0, order.totalAmount - order.amountPaid);
    const changeDue =
      order.changeDue ?? Math.max(0, order.amountPaid - order.totalAmount);
    const { products } = summarizeOrderItems(order.items);

    return [
      {
        label: "Order total",
        value: formatMoney(order.totalAmount),
        sub: formatPaymentStatus(order.paymentStatus),
        icon: Wallet,
        className: "from-primary/30 to-brand-rose/20 text-foreground",
        iconBg: "bg-primary text-primary-foreground shadow-sm",
      },
      {
        label: "Profit",
        value: formatMoney(order.profit),
        sub: "After costs",
        icon: TrendingUp,
        className: "from-emerald-500/20 to-emerald-500/5 text-emerald-900",
        iconBg: "bg-emerald-500/15 text-emerald-700",
      },
      {
        label: "Items sold",
        value: itemCountSummary(order.items),
        sub: products > 1 ? `${products} products` : undefined,
        icon: ShoppingBag,
        className: "from-violet-500/20 to-violet-500/5 text-violet-900",
        iconBg: "bg-violet-500/15 text-violet-800",
      },
      {
        label: "Amount paid",
        value: formatMoney(order.amountPaid),
        sub:
          balanceDue > 0
            ? `${formatMoney(balanceDue)} due`
            : changeDue > 0
              ? `${formatMoney(changeDue)} change`
              : "Fully paid",
        icon: CreditCard,
        className: "from-sky-500/20 to-sky-500/5 text-sky-900",
        iconBg: "bg-sky-500/15 text-sky-700",
      },
    ];
  }, [order, formatMoney]);

  if (isLoading) {
    return (
      <PageShell size="wide" className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-gradient-to-br from-brand-cream/80 to-brand-rose/30" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-gradient-to-br from-brand-cream/80 to-brand-rose/30"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-muted/30" />
      </PageShell>
    );
  }

  if (isError || !order) {
    return (
      <PageShell size="wide">
        <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-primary/20 bg-brand-cream/30 p-10 text-center">
          <ShoppingBag className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-4 font-semibold text-destructive">Order not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This order may have been removed or you don&apos;t have access.
          </p>
          <Link
            href="/dashboard/orders"
            className={cn(buttonVariants({ variant: "outline" }), "mt-6 inline-flex rounded-xl")}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to orders
          </Link>
        </div>
      </PageShell>
    );
  }

  const sold = orderItemsDisplay(order.items);
  const { quantity, products } = summarizeOrderItems(order.items);
  const changeDue =
    order.changeDue ?? Math.max(0, order.amountPaid - order.totalAmount);
  const balanceDue = Math.max(0, order.totalAmount - order.amountPaid);
  const canRefund =
    order.saleStatus !== "VOIDED" && order.saleStatus !== "REFUNDED";
  const payment = paymentStatusMeta(order.paymentStatus);
  const delivery = deliveryStatusMeta(order.deliveryStatus);

  return (
    <PageShell size="wide" className="space-y-5 pb-8">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/35 via-brand-rose/45 to-brand-cream px-4 py-5 shadow-soft sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary/25 blur-2xl"
        />
        <div className="relative space-y-4">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to orders
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {orderRef(order)}
                </h1>
                <Badge
                  className={cn(
                    "rounded-full border-0 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                    payment.badge,
                  )}
                >
                  {payment.label}
                </Badge>
                <Badge
                  className={cn(
                    "rounded-full border-0 px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                    delivery.badge,
                  )}
                >
                  <span className={cn("mr-1.5 inline-block size-1.5 rounded-full", delivery.dot)} />
                  {delivery.label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/70">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {format(new Date(order.createdAt), "EEE, MMM d yyyy · h:mm a")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Package className="size-3.5" />
                  {sold.headline}
                </span>
                {order.cashier?.name && (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="size-3.5" />
                    Cashier: {order.cashier.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              {canRefund && (
                <Button
                  variant="outline"
                  className="rounded-xl border-primary/20 bg-white/80"
                  onClick={() => setRefundOpen(true)}
                >
                  <RotateCcw className="mr-2 size-4" />
                  Refund
                </Button>
              )}
              <Link
                href={`/dashboard/orders/${order.id}/receipt`}
                className={buttonVariants({
                  className: "rounded-xl font-semibold shadow-soft",
                })}
              >
                <Receipt className="mr-2 size-4" />
                View receipt
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {statTiles.map(({ label, value, sub, icon: Icon, className, iconBg }) => (
          <div
            key={label}
            className={cn(
              "flex min-w-[10.5rem] shrink-0 flex-col gap-2 rounded-2xl border border-primary/10 bg-gradient-to-br p-4 shadow-card sm:min-w-0",
              className,
            )}
          >
            <div className="flex items-center gap-3">
              <span className={cn("flex size-10 items-center justify-center rounded-xl", iconBg)}>
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                  {label}
                </p>
                <p className="truncate text-xl font-bold tabular-nums">{value}</p>
              </div>
            </div>
            {sub && <p className="text-xs font-medium opacity-70">{sub}</p>}
          </div>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Customer"
          description="Buyer contact information"
          icon={User}
          iconTone="bg-violet-500/15 text-violet-800"
        >
          <p className="text-lg font-semibold">{order.customer.name}</p>
          <div className="mt-3 space-y-2">
            {order.customer.phone && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-3.5 shrink-0" />
                {order.customer.phone}
              </p>
            )}
            {order.customer.email && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-3.5 shrink-0" />
                {order.customer.email}
              </p>
            )}
            {!order.customer.phone && !order.customer.email && (
              <p className="text-sm text-muted-foreground">No contact details on file</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Payment"
          description="Transaction summary"
          icon={CreditCard}
          iconTone="bg-sky-500/15 text-sky-700"
        >
          <DetailRow
            label="Payment status"
            value={
              <Badge
                className={cn(
                  "rounded-full border-0 px-2.5 text-[11px] font-semibold ring-1 ring-inset",
                  payment.badge,
                )}
              >
                {payment.label}
              </Badge>
            }
          />
          {order.paymentMethod && (
            <DetailRow
              label="Method"
              value={order.paymentMethod.replace(/_/g, " ")}
            />
          )}
          {order.momoReference && (
            <DetailRow label="MoMo reference" value={order.momoReference} />
          )}
          <DetailRow label="Subtotal" value={formatMoney(order.totalAmount)} />
          <DetailRow label="Paid" value={formatMoney(order.amountPaid)} />
          {balanceDue > 0 && (
            <DetailRow
              label="Balance due"
              value={
                <span className="font-semibold text-amber-700">
                  {formatMoney(balanceDue)}
                </span>
              }
            />
          )}
          {changeDue > 0 && order.amountPaid > 0 && (
            <DetailRow label="Change" value={formatMoney(changeDue)} />
          )}
        </SectionCard>
      </div>

      <OrderDeliverySection
        orderId={order.id}
        orderRef={orderRef(order)}
        customerName={order.customer.name}
        deliveryStatus={order.deliveryStatus}
        legacyMeta={order.legacyMeta}
        customerPhone={order.customer.phone}
        disabled={
          order.saleStatus === "VOIDED" || order.saleStatus === "REFUNDED"
        }
      />

      {order.notes && (
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 to-brand-cream/40 px-4 py-4 shadow-card sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/70">
            Order notes
          </p>
          <p className="mt-1 text-sm text-amber-950">{order.notes}</p>
        </div>
      )}

      <OrderItemsSold
        items={order.items}
        totalAmount={order.totalAmount}
        formatMoney={formatMoney}
        itemCount={quantity}
        productCount={products}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard/orders"
          className={buttonVariants({
            variant: "outline",
            className: "rounded-xl border-primary/20",
          })}
        >
          All orders
        </Link>
        {canRefund && (
          <Button
            variant="outline"
            className="rounded-xl border-primary/20"
            onClick={() => setRefundOpen(true)}
          >
            <RotateCcw className="mr-2 size-4" />
            Refund items
          </Button>
        )}
        <Link
          href={`/dashboard/orders/${order.id}/receipt`}
          className={buttonVariants({ className: "rounded-xl font-semibold shadow-soft" })}
        >
          <Receipt className="mr-2 size-4" />
          Print receipt
        </Link>
      </div>

      <OrderRefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        orderId={order.id}
        orderRef={orderRef(order)}
        items={order.items}
        saleStatus={order.saleStatus}
      />
    </PageShell>
  );
}
