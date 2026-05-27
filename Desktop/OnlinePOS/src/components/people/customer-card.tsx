"use client";

import { formatDistanceToNow } from "date-fns";
import {
  ChevronRight,
  Crown,
  LogIn,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  ShoppingBag,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { openCustomerSms, openCustomerWhatsApp } from "@/lib/customers/chat";
import { cn } from "@/lib/utils";
import type { CustomerRow } from "@/components/people/customers-list";

const AVATAR_TONES = [
  "from-violet-400 to-violet-600 text-white",
  "from-sky-400 to-sky-600 text-white",
  "from-emerald-400 to-emerald-600 text-white",
  "from-amber-400 to-amber-600 text-white",
  "from-rose-400 to-rose-600 text-white",
  "from-indigo-400 to-indigo-600 text-white",
];

function avatarTone(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

function CustomerAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-bold shadow-sm",
        avatarTone(name),
        size === "sm" && "size-10 text-sm",
        size === "md" && "size-11 text-sm",
        size === "lg" && "size-12 text-base",
      )}
    >
      {initial}
    </span>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-2 ring-1 ring-inset",
        tone,
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/70 shadow-sm">
        <Icon className="size-3.5" strokeWidth={2.5} />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-80">
          {label}
        </span>
        <span className="block truncate text-xs font-semibold tabular-nums">{value}</span>
      </span>
    </div>
  );
}

function ChatActions({
  customer,
  businessName,
  onSms,
  layout = "row",
}: {
  customer: CustomerRow;
  businessName?: string;
  onSms?: () => void;
  layout?: "row" | "inline";
}) {
  const hasPhone = Boolean(customer.phone?.trim());

  return (
    <div
      className={cn(
        "flex shrink-0",
        layout === "row" ? "flex-col gap-1" : "gap-1.5",
      )}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title="WhatsApp"
        disabled={!hasPhone}
        onClick={() =>
          openCustomerWhatsApp(customer.phone, customer.name, businessName)
        }
        className="flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition-transform touch-manipulation active:scale-95 disabled:opacity-35"
      >
        <MessageCircle className="size-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        title="SMS"
        disabled={!hasPhone}
        onClick={() =>
          onSms
            ? onSms()
            : openCustomerSms(customer.phone, customer.name, businessName)
        }
        className="flex size-9 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm transition-transform touch-manipulation active:scale-95 disabled:opacity-35"
      >
        <MessageSquare className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}

type Highlight = "top" | "active" | null;

/** Mobile & tablet list row */
export function CustomerListRow({
  customer,
  formatMoney,
  businessName,
  onOpen,
  highlight,
}: {
  customer: CustomerRow;
  formatMoney: (n: number) => string;
  businessName?: string;
  onOpen: () => void;
  highlight?: Highlight;
}) {
  const orderCount = customer._count?.orders ?? 0;
  const contact = customer.phone ?? customer.email ?? customer.user?.email;
  const spent = customer.totalSpending ?? 0;

  return (
    <div className="relative">
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 flex-col gap-2.5 px-4 py-3.5 text-left active:bg-muted/50 touch-manipulation"
        >
          <div className="flex items-center gap-3">
            <CustomerAvatar name={customer.name} size="md" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-[15px] font-semibold text-foreground">
                  {customer.name}
                </span>
                {highlight === "top" && (
                  <Crown className="size-3.5 shrink-0 text-amber-500" />
                )}
                {highlight === "active" && (
                  <Sparkles className="size-3.5 shrink-0 text-emerald-500" />
                )}
              </span>
              {contact ? (
                <span className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-muted-foreground">
                  {customer.phone ? (
                    <Phone className="size-3 shrink-0 text-sky-500" />
                  ) : (
                    <Mail className="size-3 shrink-0 text-violet-500" />
                  )}
                  {contact}
                </span>
              ) : (
                <span className="mt-0.5 block text-[13px] text-muted-foreground">
                  No contact
                </span>
              )}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
          </div>

          <div className="flex gap-2 pl-14">
            <MiniStat
              icon={Wallet}
              label="Spent"
              value={formatMoney(spent)}
              tone="bg-violet-500/12 text-violet-900 ring-violet-500/20"
            />
            <MiniStat
              icon={ShoppingBag}
              label="Orders"
              value={String(orderCount)}
              tone="bg-emerald-500/12 text-emerald-900 ring-emerald-500/20"
            />
          </div>
        </button>
        <div className="flex items-center border-l border-border/50 px-2">
          <ChatActions
            customer={customer}
            businessName={businessName}
            layout="row"
          />
        </div>
      </div>
    </div>
  );
}

/** Desktop card */
export function CustomerCard({
  customer,
  formatMoney,
  businessName,
  onOpen,
  highlight,
}: {
  customer: CustomerRow;
  formatMoney: (n: number) => string;
  businessName?: string;
  onOpen: () => void;
  highlight?: Highlight;
}) {
  const orderCount = customer._count?.orders ?? 0;
  const contact = customer.phone ?? customer.email ?? customer.user?.email;

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border bg-white shadow-card transition-all hover:shadow-soft",
        highlight === "top"
          ? "border-amber-300/60 ring-1 ring-amber-200/50"
          : highlight === "active"
            ? "border-emerald-300/60 ring-1 ring-emerald-200/50"
            : "border-primary/10",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full flex-col p-4 text-left touch-manipulation sm:p-5"
      >
        <div className="flex items-start gap-3">
          <CustomerAvatar name={customer.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-base font-semibold">{customer.name}</p>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 group-hover:translate-x-0.5" />
            </div>
            {contact ? (
              <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                {customer.phone ? (
                  <Phone className="size-3.5 shrink-0 text-sky-500" />
                ) : (
                  <Mail className="size-3.5 shrink-0 text-violet-500" />
                )}
                {contact}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No contact</p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {highlight === "top" && (
                <Badge className="gap-1 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-100">
                  <Crown className="size-3" />
                  VIP
                </Badge>
              )}
              {highlight === "active" && (
                <Badge className="gap-1 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  <Sparkles className="size-3" />
                  Active
                </Badge>
              )}
              {customer.userId && (
                <Badge variant="outline" className="gap-1 rounded-full text-[10px]">
                  <LogIn className="size-3" />
                  Portal
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
            <MiniStat
              icon={Wallet}
              label="Spent"
              value={formatMoney(customer.totalSpending ?? 0)}
              tone="bg-violet-500/12 text-violet-900 ring-violet-500/20"
            />
            <MiniStat
              icon={ShoppingBag}
              label="Orders"
              value={String(orderCount)}
              tone="bg-emerald-500/12 text-emerald-900 ring-emerald-500/20"
            />
          </div>
          <ChatActions customer={customer} businessName={businessName} layout="inline" />
        </div>

        {customer.lastOrderAt && (
          <p className="mt-3 text-xs text-muted-foreground">
            Last order{" "}
            {formatDistanceToNow(new Date(customer.lastOrderAt), { addSuffix: true })}
          </p>
        )}
      </button>
    </article>
  );
}

export function CustomerListRowSkeleton() {
  return (
    <div className="space-y-2 px-4 py-3.5">
      <div className="flex gap-3">
        <div className="size-11 animate-pulse rounded-2xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-3 w-40 animate-pulse rounded-md bg-muted/70" />
        </div>
      </div>
      <div className="flex gap-2 pl-14">
        <div className="h-12 flex-1 animate-pulse rounded-xl bg-muted/60" />
        <div className="h-12 flex-1 animate-pulse rounded-xl bg-muted/60" />
      </div>
    </div>
  );
}

export function CustomerCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-primary/10 bg-white p-5">
      <div className="flex gap-3">
        <div className="size-12 rounded-2xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-36 rounded-md bg-muted" />
          <div className="h-3 w-28 rounded-md bg-muted/70" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="h-12 rounded-xl bg-muted/50" />
        <div className="h-12 rounded-xl bg-muted/50" />
      </div>
    </div>
  );
}

export function TopBuyerChip({
  customer,
  rank,
  formatMoney,
  onOpen,
}: {
  customer: CustomerRow;
  rank: number;
  formatMoney: (n: number) => string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-[10.5rem] shrink-0 snap-start flex-col rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-3.5 text-left shadow-sm touch-manipulation",
        "active:scale-[0.98] md:w-auto md:min-w-0 md:flex-1",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-xs font-bold text-white">
          {rank}
        </span>
        <CustomerAvatar name={customer.name} size="sm" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {customer.name}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums text-amber-950">
          {formatMoney(customer.totalSpending ?? 0)}
        </span>
        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
          <ShoppingBag className="size-3" />
          {customer._count?.orders ?? 0}
        </span>
      </div>
    </button>
  );
}

export { CustomerAvatar, ChatActions };
