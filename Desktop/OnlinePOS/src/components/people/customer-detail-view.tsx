"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Crown,
  LogIn,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  Phone,
  Receipt,
  Send,
  ShoppingBag,
  Star,
  Truck,
  User,
  Wallet,
} from "lucide-react";
import { OrderItemsSold } from "@/components/dashboard/orders/order-items-sold";
import { paymentStatusMeta } from "@/components/dashboard/orders/orders-styles";
import { EmptyState } from "@/components/layout/empty-state";
import { PageShell } from "@/components/layout/page-shell";
import { useBusinessSettings } from "@/components/settings/business-settings-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { TextAreaField } from "@/components/settings/fields";
import { parseApiResponse } from "@/lib/api-client";
import { openCustomerWhatsApp } from "@/lib/customers/chat";
import type { CustomerDetailPayload } from "@/lib/customers/types";
import { deliveryStatusMeta } from "@/lib/orders/delivery";
import { formatPaymentStatus, itemCountSummary, orderRef } from "@/lib/orders/format";
import { cn } from "@/lib/utils";

function SectionCard({
  title,
  description,
  icon: Icon,
  iconClass,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon: typeof User;
  iconClass: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-card",
        className,
      )}
    >
      <div className="flex items-start gap-3 border-b border-primary/10 bg-gradient-to-r from-brand-cream/50 to-brand-rose/25 px-4 py-4 sm:px-5">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
            iconClass,
          )}
        >
          <Icon className="size-5 text-white" strokeWidth={2} />
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

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Wallet;
  tone: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-primary/10 bg-gradient-to-br p-4 shadow-sm",
        tone,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
          {label}
        </span>
        <Icon className="size-4 opacity-70" strokeWidth={2} />
      </div>
      <p className="text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
      {sub && <p className="text-xs font-medium opacity-70">{sub}</p>}
    </div>
  );
}

function OrderBlock({
  order,
  formatMoney,
  expanded,
  onToggle,
}: {
  order: CustomerDetailPayload["orders"][number];
  formatMoney: (n: number) => string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const payment = paymentStatusMeta(order.paymentStatus);
  const delivery = deliveryStatusMeta(order.deliveryStatus);
  const PaymentIcon = payment.icon;
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const productCount = order.items.length;
  const deliveryLine =
    order.delivery.formattedAddress ??
    order.delivery.address ??
    [order.delivery.city, order.delivery.region].filter(Boolean).join(", ");

  return (
    <article className="overflow-hidden rounded-xl border border-primary/10 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-4 text-left touch-manipulation active:bg-muted/30"
      >
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            payment.iconBg,
          )}
        >
          <PaymentIcon className="size-5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{orderRef(order)}</span>
            <Badge variant="outline" className={cn("text-[10px]", payment.badge)}>
              {formatPaymentStatus(order.paymentStatus)}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px]", delivery.badge)}>
              {delivery.label}
            </Badge>
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {format(new Date(order.createdAt), "MMM d, yyyy · h:mm a")} ·{" "}
            {itemCountSummary(order.items)}
          </span>
          <span className="mt-2 flex flex-wrap gap-3 text-sm">
            <span>
              <span className="text-muted-foreground">Total </span>
              <span className="font-bold tabular-nums">{formatMoney(order.totalAmount)}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Paid </span>
              <span className="font-semibold tabular-nums text-emerald-700">
                {formatMoney(order.amountPaid)}
              </span>
            </span>
            {order.totalAmount > order.amountPaid && (
              <span>
                <span className="text-muted-foreground">Due </span>
                <span className="font-semibold tabular-nums text-amber-700">
                  {formatMoney(order.totalAmount - order.amountPaid)}
                </span>
              </span>
            )}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-primary/10 bg-brand-cream/15 px-4 py-4">
          {deliveryLine && (
            <div className="flex gap-2 rounded-xl border border-sky-200/80 bg-sky-50/80 p-3 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-sky-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-800/80">
                  Delivery address
                </p>
                <p className="mt-0.5 font-medium text-sky-950">{deliveryLine}</p>
                {order.delivery.phone && (
                  <p className="mt-1 text-xs text-sky-800/70">Phone: {order.delivery.phone}</p>
                )}
              </div>
            </div>
          )}
          <OrderItemsSold
            items={order.items}
            totalAmount={order.totalAmount}
            formatMoney={formatMoney}
            itemCount={itemCount}
            productCount={productCount}
          />
          <Link
            href={`/dashboard/orders/${order.id}`}
            className={buttonVariants({
              variant: "outline",
              className: "w-full rounded-xl",
            })}
          >
            <Receipt className="mr-2 size-4" />
            Open full order
          </Link>
        </div>
      )}
    </article>
  );
}

export function CustomerDetailView() {
  const params = useParams();
  const customerId = params.id as string;
  const { formatMoney, businessName } = useBusinessSettings();
  const [message, setMessage] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const { data: customer, isLoading, isError, error } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}`);
      return parseApiResponse<CustomerDetailPayload>(res);
    },
  });

  const smsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/customers/${customerId}/sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("SMS sent");
      setMessage("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <PageShell className="space-y-4">
        <div className="h-32 animate-pulse rounded-2xl bg-muted/50" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      </PageShell>
    );
  }

  if (isError || !customer) {
    return (
      <PageShell>
        <EmptyState
          title="Customer not found"
          message={error instanceof Error ? error.message : "This profile may have been removed."}
          action={
            <Link
              href="/dashboard/people/customers"
              className={buttonVariants({ className: "rounded-xl" })}
            >
              Back to customers
            </Link>
          }
        />
      </PageShell>
    );
  }

  const displayEmail = customer.email ?? customer.user?.email;
  const canSms = Boolean(customer.phone?.trim());
  const initial = customer.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <PageShell size="wide" className="space-y-5 pb-8 sm:space-y-6">
      <Link
        href="/dashboard/people/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Customers
      </Link>

      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/40 via-brand-rose/50 to-brand-cream px-4 py-5 shadow-soft sm:px-6 sm:py-6">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-primary shadow-md">
              {initial}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                {customer.name}
              </h1>
              <p className="mt-1 text-sm text-foreground/75">
                Customer since {format(new Date(customer.createdAt), "MMM d, yyyy")}
                {customer.userId && " · Portal account"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {customer.tags.map((tag) => (
                  <Badge key={tag} className="rounded-full bg-white/80 text-foreground">
                    {tag}
                  </Badge>
                ))}
                {customer.userId && (
                  <Badge className="gap-1 rounded-full bg-violet-500/20 text-violet-900">
                    <LogIn className="size-3" />
                    Portal
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="gap-2 rounded-xl bg-white/90 shadow-sm"
              disabled={!canSms}
              onClick={() =>
                openCustomerWhatsApp(customer.phone, customer.name, businessName)
              }
            >
              <MessageCircle className="size-4 text-emerald-600" />
              WhatsApp
            </Button>
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className={buttonVariants({
                  variant: "secondary",
                  className: "gap-2 rounded-xl bg-white/90 shadow-sm",
                })}
              >
                <Phone className="size-4 text-sky-600" />
                Call
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <StatTile
          label="Total spent"
          value={formatMoney(customer.stats.totalSpending)}
          sub={`${customer.stats.totalOrders} orders`}
          icon={ShoppingBag}
          tone="from-violet-500/20 to-violet-500/5 text-violet-950"
        />
        <StatTile
          label="Amount paid"
          value={formatMoney(customer.stats.totalAmountPaid)}
          sub="All time"
          icon={Wallet}
          tone="from-emerald-500/25 to-emerald-500/5 text-emerald-950"
        />
        <StatTile
          label="Outstanding"
          value={formatMoney(customer.stats.totalOutstanding)}
          sub={`${customer.stats.pendingPayments} unpaid orders`}
          icon={Receipt}
          tone="from-amber-500/25 to-amber-500/5 text-amber-950"
        />
        <StatTile
          label="Balance"
          value={formatMoney(customer.balance)}
          sub={
            customer.stats.lastPurchase
              ? `Last order ${formatDistanceToNow(new Date(customer.stats.lastPurchase), { addSuffix: true })}`
              : "No orders yet"
          }
          icon={Calendar}
          tone="from-sky-500/25 to-sky-500/5 text-sky-950"
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-2">
          <SectionCard
            title="Contact"
            icon={User}
            iconClass="bg-gradient-to-br from-primary to-brand-rose"
          >
            <div className="space-y-2">
              {customer.phone ? (
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-3 rounded-xl border border-sky-200/80 bg-sky-50/60 p-3 transition-colors hover:bg-sky-50"
                >
                  <Phone className="size-4 text-sky-600" />
                  <span className="font-medium">{customer.phone}</span>
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No phone on file</p>
              )}
              {displayEmail ? (
                <a
                  href={`mailto:${displayEmail}`}
                  className="flex items-center gap-3 rounded-xl border border-violet-200/80 bg-violet-50/60 p-3 transition-colors hover:bg-violet-50"
                >
                  <Mail className="size-4 text-violet-600" />
                  <span className="truncate font-medium">{displayEmail}</span>
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No email on file</p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Delivery addresses"
            description="Saved & from recent orders"
            icon={MapPin}
            iconClass="bg-gradient-to-br from-sky-500 to-sky-600"
          >
            {customer.deliveryAddresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No delivery addresses yet.</p>
            ) : (
              <ul className="space-y-2">
                {customer.deliveryAddresses.map((addr, i) => (
                  <li
                    key={`${addr.source}-${i}`}
                    className="rounded-xl border border-primary/10 bg-brand-cream/20 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="size-3.5 text-sky-600" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {addr.label}
                      </span>
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {addr.source === "profile" ? "Saved" : "Order"}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm font-medium leading-snug">{addr.address}</p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Send SMS"
            description={canSms ? `To ${customer.phone}` : "Add a phone number first"}
            icon={MessageSquare}
            iconClass="bg-gradient-to-br from-emerald-500 to-emerald-600"
          >
            <div className="space-y-3">
              <TextAreaField
                label="Message"
                value={message}
                onChange={setMessage}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/480 · Requires SMS enabled in Settings
              </p>
              <Button
                className="w-full gap-2 rounded-xl"
                disabled={!message.trim() || !canSms || smsMutation.isPending}
                onClick={() => smsMutation.mutate()}
              >
                <Send className="size-4" />
                {smsMutation.isPending ? "Sending…" : "Send SMS"}
              </Button>
            </div>
          </SectionCard>

          {customer.stats.favoriteProducts.length > 0 && (
            <SectionCard
              title="Best buys"
              icon={Star}
              iconClass="bg-gradient-to-br from-amber-400 to-amber-500"
            >
              <ul className="space-y-2">
                {customer.stats.favoriteProducts.map((p) => (
                  <li
                    key={p.name}
                    className="flex items-center justify-between rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2 truncate font-medium">
                      <Package className="size-3.5 shrink-0 text-amber-600" />
                      {p.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {p.quantity}×
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {customer.notes && (
            <SectionCard title="Notes" icon={User} iconClass="bg-gradient-to-br from-slate-500 to-slate-600">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{customer.notes}</p>
            </SectionCard>
          )}
        </div>

        {/* Orders column */}
        <div className="space-y-4 lg:col-span-3">
          <SectionCard
            title="Orders & items"
            description={`${customer.stats.totalOrders} orders · ${formatMoney(customer.stats.totalAmountPaid)} paid in total`}
            icon={ShoppingBag}
            iconClass="bg-gradient-to-br from-violet-500 to-violet-600"
            className="h-fit"
          >
            {customer.orders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No orders yet"
                message="Orders from this customer will appear here with items and delivery info."
              />
            ) : (
              <div className="space-y-3">
                {customer.orders.map((order) => (
                  <OrderBlock
                    key={order.id}
                    order={order}
                    formatMoney={formatMoney}
                    expanded={expandedOrderId === order.id}
                    onToggle={() =>
                      setExpandedOrderId((id) => (id === order.id ? null : order.id))
                    }
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
