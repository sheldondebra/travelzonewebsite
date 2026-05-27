"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CreditCard, Gift, LayoutDashboard, ListChecks, Plug, ReceiptText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { formatBillingMoney, billingPaymentStatusLabel } from "@/lib/billing/format";
import { cn } from "@/lib/utils";

type Tab = "overview" | "plans" | "coupons" | "providers" | "payments" | "subscriptions";

type BillingPlan = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  isPopular: boolean;
  prices: { interval: string; currency: string; amount: number }[];
};

type BillingCoupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  redeemedCount: number;
  maxRedemptions: number | null;
  isActive: boolean;
};

type BillingProviderConfig = {
  provider: "STRIPE" | "PAYSTACK" | "FLUTTERWAVE" | "MANUAL";
  enabled: boolean;
  publicKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  supportedCurrencies: string[];
  defaultForCurrencies: string[];
};

type BillingPayment = {
  id: string;
  status: keyof typeof billingPaymentStatusLabel;
  provider: string;
  currency: string;
  totalAmount: number;
  createdAt: string;
  business: { name: string; slug: string };
  plan: { name: string };
  coupon: { code: string } | null;
};

type BillingSubscription = {
  id: string;
  status: string;
  interval: string;
  currency: string;
  currentPeriodEnd: string | null;
  business: { name: string; slug: string };
  plan: { name: string };
};

type BillingAnalytics = {
  totals: {
    revenue: number;
    successfulPayments: number;
    activeSubscriptions: number;
    failedOrDeclined: number;
  };
  revenueTrend: { label: string; revenue: number; failures: number }[];
  paymentStatusBreakdown: { status: string; count: number }[];
  providerBreakdown: { provider: string; count: number; revenue: number }[];
};

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "plans", label: "Plans", icon: ListChecks },
  { id: "coupons", label: "Coupons", icon: Gift },
  { id: "providers", label: "Providers", icon: Plug },
  { id: "payments", label: "Payments", icon: ReceiptText },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
];

export function GeneralOfficeBilling() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "PERCENT",
    discountValue: 10,
    maxRedemptions: 100,
  });
  const [providerForm, setProviderForm] = useState({
    provider: "STRIPE",
    enabled: true,
    publicKey: "",
    secretKey: "",
    webhookSecret: "",
    supportedCurrencies: "USD,EUR,GBP",
    defaultForCurrencies: "USD,EUR,GBP",
  });

  const { data: analytics } = useQuery({
    queryKey: ["platform-billing-analytics"],
    queryFn: async () => parseApiResponse<BillingAnalytics>(await fetch("/api/platform/billing/analytics")),
  });
  const { data: plans = [] } = useQuery({
    queryKey: ["platform-billing-plans"],
    queryFn: async () => parseApiResponse<BillingPlan[]>(await fetch("/api/platform/billing/plans")),
  });
  const { data: coupons = [] } = useQuery({
    queryKey: ["platform-billing-coupons"],
    queryFn: async () => parseApiResponse<BillingCoupon[]>(await fetch("/api/platform/billing/coupons")),
  });
  const { data: providers = [] } = useQuery({
    queryKey: ["platform-billing-providers"],
    queryFn: async () =>
      parseApiResponse<BillingProviderConfig[]>(await fetch("/api/platform/billing/providers")),
  });
  const { data: payments = [] } = useQuery({
    queryKey: ["platform-billing-payments"],
    queryFn: async () =>
      parseApiResponse<BillingPayment[]>(await fetch("/api/platform/billing/payments")),
  });
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["platform-billing-subscriptions"],
    queryFn: async () =>
      parseApiResponse<BillingSubscription[]>(
        await fetch("/api/platform/billing/subscriptions"),
      ),
  });

  const seedPlans = useMutation({
    mutationFn: async () =>
      parseApiResponse(await fetch("/api/platform/billing/plans", { method: "PUT" })),
    onSuccess: () => {
      toast.success("Default plans seeded");
      queryClient.invalidateQueries({ queryKey: ["platform-billing-plans"] });
    },
  });

  const createCoupon = useMutation({
    mutationFn: async () =>
      parseApiResponse(
        await fetch("/api/platform/billing/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(couponForm),
        }),
      ),
    onSuccess: () => {
      toast.success("Coupon created");
      setCouponForm({ code: "", discountType: "PERCENT", discountValue: 10, maxRedemptions: 100 });
      queryClient.invalidateQueries({ queryKey: ["platform-billing-coupons"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveProvider = useMutation({
    mutationFn: async () =>
      parseApiResponse(
        await fetch("/api/platform/billing/providers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...providerForm,
            supportedCurrencies: providerForm.supportedCurrencies
              .split(",")
              .map((v) => v.trim().toUpperCase())
              .filter(Boolean),
            defaultForCurrencies: providerForm.defaultForCurrencies
              .split(",")
              .map((v) => v.trim().toUpperCase())
              .filter(Boolean),
          }),
        }),
      ),
    onSuccess: () => {
      toast.success("Provider saved");
      queryClient.invalidateQueries({ queryKey: ["platform-billing-providers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const totals = analytics?.totals;

  return (
    <PageShell size="wide" className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <CreditCard className="size-8 text-primary" />
            Billing
          </h1>
          <p className="text-muted-foreground">
            SaaS packages, coupons, provider settings, client subscriptions, and
            payment status tracking.
          </p>
        </div>
        <Button onClick={() => seedPlans.mutate()} disabled={seedPlans.isPending}>
          Seed default packages
        </Button>
      </header>

      <div className="flex gap-1 overflow-x-auto rounded-xl border bg-white p-1 shadow-sm">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
                tab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Revenue" value={formatBillingMoney("GHS", totals?.revenue ?? 0)} />
            <Stat label="Successful payments" value={totals?.successfulPayments ?? 0} />
            <Stat label="Active subscriptions" value={totals?.activeSubscriptions ?? 0} />
            <Stat label="Failed/declined" value={totals?.failedOrDeclined ?? 0} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartPanel title="Subscription revenue">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={analytics?.revenueTrend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#f472b6" fill="#fce7f3" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartPanel>
            <ChartPanel title="Provider payments">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics?.providerBreakdown ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="provider" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>
        </div>
      )}

      {tab === "plans" && (
        <Panel title="Packages">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Mapped tier</TableHead>
                <TableHead>Monthly/Yearly prices</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.slug}</p>
                  </TableCell>
                  <TableCell>{plan.plan}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {plan.prices
                      .map((price) =>
                        `${price.interval}: ${formatBillingMoney(price.currency, price.amount)}`,
                      )
                      .join(" · ")}
                  </TableCell>
                  <TableCell>
                    <Badge className={plan.isActive ? "bg-emerald-100 text-emerald-800" : ""}>
                      {plan.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}

      {tab === "coupons" && (
        <Panel title="Coupons">
          <div className="grid gap-3 border-b p-4 md:grid-cols-5">
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="Code"
              value={couponForm.code}
              onChange={(event) =>
                setCouponForm((form) => ({ ...form, code: event.target.value.toUpperCase() }))
              }
            />
            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={couponForm.discountType}
              onChange={(event) =>
                setCouponForm((form) => ({ ...form, discountType: event.target.value }))
              }
            >
              <option value="PERCENT">Percent</option>
              <option value="FIXED">Fixed</option>
            </select>
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              type="number"
              value={couponForm.discountValue}
              onChange={(event) =>
                setCouponForm((form) => ({ ...form, discountValue: Number(event.target.value) }))
              }
            />
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              type="number"
              value={couponForm.maxRedemptions}
              onChange={(event) =>
                setCouponForm((form) => ({ ...form, maxRedemptions: Number(event.target.value) }))
              }
            />
            <Button onClick={() => createCoupon.mutate()} disabled={createCoupon.isPending}>
              Generate coupon
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium">{coupon.code}</TableCell>
                  <TableCell>
                    {coupon.discountType === "PERCENT"
                      ? `${coupon.discountValue}%`
                      : coupon.discountValue}
                  </TableCell>
                  <TableCell>
                    {coupon.redeemedCount}/{coupon.maxRedemptions ?? "∞"}
                  </TableCell>
                  <TableCell>{coupon.isActive ? "Active" : "Inactive"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}

      {tab === "providers" && (
        <Panel title="Payment providers">
          <div className="grid gap-3 border-b p-4 md:grid-cols-3">
            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={providerForm.provider}
              onChange={(event) =>
                setProviderForm((form) => ({ ...form, provider: event.target.value }))
              }
            >
              <option value="STRIPE">Stripe</option>
              <option value="PAYSTACK">Paystack</option>
              <option value="FLUTTERWAVE">Flutterwave</option>
            </select>
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="Public key"
              value={providerForm.publicKey}
              onChange={(event) =>
                setProviderForm((form) => ({ ...form, publicKey: event.target.value }))
              }
            />
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="Secret key"
              value={providerForm.secretKey}
              onChange={(event) =>
                setProviderForm((form) => ({ ...form, secretKey: event.target.value }))
              }
            />
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="Webhook secret/hash"
              value={providerForm.webhookSecret}
              onChange={(event) =>
                setProviderForm((form) => ({ ...form, webhookSecret: event.target.value }))
              }
            />
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="Supported currencies"
              value={providerForm.supportedCurrencies}
              onChange={(event) =>
                setProviderForm((form) => ({
                  ...form,
                  supportedCurrencies: event.target.value,
                }))
              }
            />
            <Button onClick={() => saveProvider.mutate()} disabled={saveProvider.isPending}>
              Save provider
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Currencies</TableHead>
                <TableHead>Default for</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.provider}>
                  <TableCell>{provider.provider}</TableCell>
                  <TableCell>{provider.supportedCurrencies.join(", ") || "—"}</TableCell>
                  <TableCell>{provider.defaultForCurrencies.join(", ") || "—"}</TableCell>
                  <TableCell>{provider.enabled ? "Enabled" : "Disabled"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}

      {tab === "payments" && (
        <Panel title="Payments">
          <BillingPaymentTable payments={payments} />
        </Panel>
      )}

      {tab === "subscriptions" && (
        <Panel title="Client subscriptions">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Renews</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <p className="font-medium">{subscription.business.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {subscription.business.slug}
                    </p>
                  </TableCell>
                  <TableCell>{subscription.plan.name}</TableCell>
                  <TableCell>{subscription.status}</TableCell>
                  <TableCell>
                    {subscription.interval} · {subscription.currency}
                  </TableCell>
                  <TableCell>
                    {subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-card">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-white shadow-card">
      <div className="border-b bg-muted/30 px-4 py-4">
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function BillingPaymentTable({ payments }: { payments: BillingPayment[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Business</TableHead>
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
            <TableCell>
              <p className="font-medium">{payment.business.name}</p>
              <p className="text-xs text-muted-foreground">{payment.business.slug}</p>
            </TableCell>
            <TableCell>{payment.plan.name}</TableCell>
            <TableCell>{billingPaymentStatusLabel[payment.status]}</TableCell>
            <TableCell>{payment.provider}</TableCell>
            <TableCell>{formatBillingMoney(payment.currency, payment.totalAmount)}</TableCell>
            <TableCell>{payment.coupon?.code ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
