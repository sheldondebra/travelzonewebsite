"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, CreditCard } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseApiResponse } from "@/lib/api-client";
import { billingPaymentStatusLabel, formatBillingMoney } from "@/lib/billing/format";
import { cn } from "@/lib/utils";

type PriceRow = {
  interval: "MONTHLY" | "YEARLY";
  currency: string;
  amount: number;
};

type PlanRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isPopular: boolean;
  features: string[] | null;
  prices: PriceRow[];
};

type SubscriptionRow = {
  status: string;
  interval: string;
  currency: string;
  currentPeriodEnd: string | null;
  plan: { name: string };
} | null;

type PaymentRow = {
  id: string;
  status: keyof typeof billingPaymentStatusLabel;
  provider: string;
  currency: string;
  totalAmount: number;
  createdAt: string;
  plan: { name: string };
  coupon: { code: string } | null;
};

export function BillingSettings() {
  const [interval, setInterval] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [currency, setCurrency] = useState("GHS");
  const [couponCode, setCouponCode] = useState("");

  const { data: plans = [] } = useQuery({
    queryKey: ["billing-plans"],
    queryFn: async () => parseApiResponse<PlanRow[]>(await fetch("/api/billing/plans")),
  });
  const { data: subscription } = useQuery({
    queryKey: ["billing-subscription"],
    queryFn: async () =>
      parseApiResponse<SubscriptionRow>(await fetch("/api/billing/subscription")),
  });
  const { data: payments = [] } = useQuery({
    queryKey: ["billing-payments"],
    queryFn: async () => parseApiResponse<PaymentRow[]>(await fetch("/api/billing/payments")),
  });

  const currencies = useMemo(() => {
    const set = new Set<string>();
    for (const plan of plans) {
      for (const price of plan.prices) set.add(price.currency);
    }
    return Array.from(set).sort();
  }, [plans]);

  const checkout = useMutation({
    mutationFn: async (planId: string) =>
      parseApiResponse<{ checkoutUrl: string }>(
        await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            interval,
            currency,
            couponCode: couponCode || undefined,
          }),
        }),
      ),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageShell size="wide" className="space-y-5">
      <PageHeader
        title="Billing"
        description="Manage your subscription, switch monthly or yearly billing, change currency, and review payment history."
      />

      <section className="rounded-2xl border bg-white p-5 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <CreditCard className="size-5" />
            </span>
            <div>
              <p className="font-semibold">
                {subscription ? subscription.plan.name : "No active subscription"}
              </p>
              <p className="text-sm text-muted-foreground">
                {subscription
                  ? `${subscription.status} · ${subscription.interval} · ${subscription.currency}`
                  : "Choose a plan below to activate billing."}
              </p>
            </div>
          </div>
          {subscription?.currentPeriodEnd && (
            <Badge className="w-fit rounded-full bg-emerald-100 text-emerald-800">
              Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl bg-muted p-1">
          {(["MONTHLY", "YEARLY"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setInterval(value)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium",
                interval === value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {value === "MONTHLY" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="h-10 rounded-xl border bg-white px-3 text-sm"
          >
            {(currencies.length ? currencies : ["GHS", "USD"]).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="h-10 rounded-xl border bg-white px-3 text-sm"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {plans.map((plan) => {
          const price = plan.prices.find(
            (row) => row.interval === interval && row.currency === currency,
          );
          return (
            <article
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-5 shadow-card",
                plan.isPopular && "border-primary ring-2 ring-primary/15",
              )}
            >
              <h2 className="text-lg font-bold">{plan.name}</h2>
              <p className="mt-2 min-h-12 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <p className="mt-4 text-2xl font-bold">
                {price ? formatBillingMoney(currency, price.amount) : "N/A"}
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {(plan.features ?? []).slice(0, 4).map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 size-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-5"
                disabled={!price || checkout.isPending}
                onClick={() => checkout.mutate(plan.id)}
              >
                {price?.amount === 0 ? "Use free plan" : "Switch plan"}
              </Button>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-card">
        <div className="border-b bg-muted/30 px-4 py-4">
          <h2 className="font-semibold">Billing history</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Coupon</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{payment.plan.name}</TableCell>
                <TableCell>{billingPaymentStatusLabel[payment.status]}</TableCell>
                <TableCell>{payment.provider}</TableCell>
                <TableCell>{formatBillingMoney(payment.currency, payment.totalAmount)}</TableCell>
                <TableCell>{payment.coupon?.code ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </PageShell>
  );
}
