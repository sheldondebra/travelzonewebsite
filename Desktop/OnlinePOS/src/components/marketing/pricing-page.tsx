"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  Globe2,
  ShieldCheck,
  Sparkles,
  Store,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseApiResponse } from "@/lib/api-client";
import { detectBillingCurrency } from "@/lib/billing/currency-detection";
import { formatBillingMoney } from "@/lib/billing/format";
import { cn } from "@/lib/utils";

type PriceRow = {
  id: string;
  interval: "MONTHLY" | "YEARLY";
  currency: string;
  amount: number;
};

type PlanRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  plan: string;
  features: string[] | null;
  comparison: Record<string, string | number | boolean> | null;
  isPopular: boolean;
  prices: PriceRow[];
};

const comparisonRows = [
  { key: "trial", label: "Free access" },
  { key: "users", label: "Users" },
  { key: "products", label: "Products" },
  { key: "reports", label: "Reports" },
  { key: "support", label: "Support" },
  { key: "sms", label: "SMS receipts" },
] as const;

export function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [interval, setInterval] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [manualCurrency, setManualCurrency] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanRow | null>(null);
  const [checkoutCoupon, setCheckoutCoupon] = useState("");

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["billing-plans"],
    queryFn: async () => {
      const res = await fetch("/api/billing/plans");
      return parseApiResponse<PlanRow[]>(res);
    },
  });

  const currencies = useMemo(() => {
    const values = new Set<string>();
    for (const plan of plans) {
      for (const price of plan.prices) values.add(price.currency);
    }
    return Array.from(values).sort();
  }, [plans]);

  const detectedCurrency = useMemo(() => {
    if (currencies.length === 0 || typeof window === "undefined") {
      return { country: null, currency: "GHS", detected: false };
    }
    return detectBillingCurrency({
      locale: navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      availableCurrencies: currencies,
    });
  }, [currencies]);
  const currency = manualCurrency ?? detectedCurrency.currency;

  const checkout = useMutation({
    mutationFn: async ({
      planId,
      couponCode,
    }: {
      planId: string;
      couponCode?: string;
    }) => {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          interval,
          currency,
          country: detectedCurrency.country ?? undefined,
          couponCode: couponCode || undefined,
        }),
      });
      return parseApiResponse<{ checkoutUrl: string }>(res);
    },
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const selectedPrice = selectedPlan?.prices.find(
    (row) => row.interval === interval && row.currency === currency,
  );

  function openCheckout(plan: PlanRow) {
    setCheckoutCoupon("");
    setSelectedPlan(plan);
  }

  function startCheckout(plan: PlanRow, couponCode?: string) {
    if (!session?.user?.businessId) {
      const params = new URLSearchParams({
        plan: plan.slug,
        interval,
        currency,
      });
      if (detectedCurrency.country) params.set("country", detectedCurrency.country);
      if (couponCode?.trim()) params.set("coupon", couponCode.trim().toUpperCase());
      router.push(`/register?${params.toString()}`);
      return;
    }
    checkout.mutate({
      planId: plan.id,
      couponCode: couponCode?.trim().toUpperCase(),
    });
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#fff1f7,transparent_35%),linear-gradient(180deg,#fffaf7,#fff)]">
      <header className="glass-light sticky top-0 z-50 border-b border-gray-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
              <Store className="size-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Social Commerce</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
              Sign in
            </Link>
            <Link href="/register" className={cn(buttonVariants(), "h-10 px-5")}>
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-12 px-6 py-14">
        <section className="relative mx-auto max-w-4xl text-center">
          <div className="absolute inset-x-12 top-10 -z-10 h-40 rounded-full bg-primary/20 blur-3xl" />
          <Badge className="rounded-full bg-primary/15 px-3 py-1 text-primary">
            <Sparkles className="mr-1 size-3" />
            SaaS billing for every market
          </Badge>
          <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
            Pricing that scales from first sale to flagship store
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Currency is detected from your country, yearly billing saves more,
            and coupons are applied during checkout where the final amount is confirmed.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Globe2, label: "Auto country pricing", value: currency },
              { icon: ShieldCheck, label: "Secure checkout", value: "Stripe + local rails" },
              { icon: Zap, label: "Free plan", value: "14 days" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl border bg-white/80 p-4 shadow-soft">
                <Icon className="mx-auto size-5 text-primary" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="sticky top-20 z-30 flex flex-col gap-3 rounded-3xl border border-primary/10 bg-white/90 p-4 shadow-elevated backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {detectedCurrency.country && (
              <p className="text-xs text-muted-foreground">
                Detected {detectedCurrency.country}; showing {currency}
              </p>
            )}
            <select
              value={currency}
              onChange={(event) => setManualCurrency(event.target.value)}
              className="h-10 rounded-xl border bg-white px-3 text-sm"
            >
              {(currencies.length ? currencies : ["GHS", "USD"]).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading pricing...</p>
          ) : (
            plans.map((plan) => {
              const price = plan.prices.find(
                (row) => row.interval === interval && row.currency === currency,
              );
              return (
                <article
                  key={plan.id}
                  className={cn(
                    "relative flex min-h-[520px] flex-col overflow-hidden rounded-3xl border bg-white p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated",
                    plan.isPopular && "border-primary ring-2 ring-primary/20 lg:scale-[1.03]",
                  )}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-brand-rose to-brand-lavender" />
                  {plan.isPopular && (
                    <Badge className="absolute right-4 top-4 rounded-full bg-primary text-primary-foreground">
                      Popular
                    </Badge>
                  )}
                  <h2 className="pr-20 text-xl font-bold">{plan.name}</h2>
                  <p className="mt-2 min-h-12 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                  <p className="mt-5 text-3xl font-bold">
                    {price ? formatBillingMoney(currency, price.amount) : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {price?.amount === 0
                      ? "14-day free plan access"
                      : `per ${interval === "MONTHLY" ? "month" : "year"}`}
                  </p>
                  <ul className="mt-5 flex-1 space-y-2">
                    {(plan.features ?? []).map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm">
                        <Check className="mt-0.5 size-4 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6"
                    disabled={!price || checkout.isPending}
                    onClick={() => openCheckout(plan)}
                  >
                    {price?.amount === 0 ? "Start 14-day free plan" : "Continue"}
                    <ArrowRight className="size-4" />
                  </Button>
                </article>
              );
            })
          )}
        </section>

        <section className="overflow-hidden rounded-3xl border bg-white shadow-card">
          <div className="border-b bg-gradient-to-r from-brand-cream/70 to-brand-rose/20 p-5">
            <h2 className="text-xl font-semibold">Compare plans</h2>
            <p className="text-sm text-muted-foreground">
              A clean breakdown of limits, reports, support, and messaging features.
            </p>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-4 text-left">Compare features</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="p-4 text-left">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.key} className="border-b last:border-0">
                  <td className="p-4 font-medium">{row.label}</td>
                  {plans.map((plan) => (
                    <td key={`${plan.id}-${row.key}`} className="p-4 text-muted-foreground">
                      {String(plan.comparison?.[row.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>
      </main>

      <Dialog open={Boolean(selectedPlan)} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm checkout</DialogTitle>
            <DialogDescription>
              Review your billing choice and enter a coupon before checkout.
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{selectedPlan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {interval === "MONTHLY" ? "Monthly" : "Yearly"} · {currency}
                    </p>
                  </div>
                  <p className="text-xl font-bold">
                    {selectedPrice
                      ? formatBillingMoney(currency, selectedPrice.amount)
                      : "N/A"}
                  </p>
                </div>
                {selectedPrice?.amount === 0 && (
                  <p className="mt-3 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
                    Free plan access lasts 14 days. Upgrade anytime from billing settings.
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="pricing-coupon">
                  Coupon code
                </label>
                <input
                  id="pricing-coupon"
                  value={checkoutCoupon}
                  onChange={(event) => setCheckoutCoupon(event.target.value.toUpperCase())}
                  placeholder="Enter coupon at checkout"
                  className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPlan(null)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedPlan || !selectedPrice || checkout.isPending}
              onClick={() => selectedPlan && startCheckout(selectedPlan, checkoutCoupon)}
            >
              {checkout.isPending ? "Preparing..." : "Proceed to checkout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
