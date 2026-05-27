"use client";

import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  ShoppingBag,
  Star,
  User,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TextAreaField } from "@/components/settings/fields";
import { parseApiResponse } from "@/lib/api-client";
import { openCustomerWhatsApp } from "@/lib/customers/chat";
import { orderRef } from "@/lib/orders/format";

export type CustomerDetail = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  tags: string[];
  balance: number;
  createdAt: string;
  userId: string | null;
  user?: { id: string; email: string } | null;
  orders: {
    id: string;
    reference: string | null;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
  }[];
  stats: {
    totalOrders: number;
    totalSpending: number;
    lastPurchase: string | null;
    pendingPayments: number;
    favoriteProducts: { name: string; quantity: number }[];
  };
};

function money(n: number) {
  return `₵${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Phone;
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  if (!value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-muted-foreground">
        <Icon className="size-4 shrink-0 opacity-50" />
        <span>No {label.toLowerCase()} on file</span>
      </div>
    );
  }

  const content = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
        <Icon className="size-4 text-primary" strokeWidth={1.5} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:bg-brand-rose/30"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
      {content}
    </div>
  );
}

export function CustomerDetailSheet({
  customer,
  open,
  onOpenChange,
  isLoading,
  businessName,
}: {
  customer: CustomerDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
  businessName?: string;
}) {
  const [smsOpen, setSmsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const smsMutation = useMutation({
    mutationFn: async () => {
      if (!customer) throw new Error("No customer selected");
      const res = await fetch(`/api/customers/${customer.id}/sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      toast.success("SMS sent");
      setSmsOpen(false);
      setMessage("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!customer && !isLoading) return null;

  const portalEmail = customer?.user?.email ?? null;
  const displayEmail = customer?.email ?? portalEmail;
  const canSms = Boolean(customer?.phone?.trim());

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-md lg:max-w-lg"
        >
          <SheetHeader className="border-b border-border/60 bg-white px-5 py-4 text-left sm:px-6 sm:py-5">
            <SheetTitle className="pr-8 text-lg font-semibold tracking-tight sm:text-xl">
              {isLoading ? "Loading…" : customer!.name}
            </SheetTitle>
            {!isLoading && customer && (
              <SheetDescription className="text-[13px]">
                Since {format(new Date(customer.createdAt), "MMM d, yyyy")}
                {customer.userId && " · Portal linked"}
              </SheetDescription>
            )}
          </SheetHeader>

          {isLoading || !customer ? (
            <div className="flex-1 space-y-4 px-6 py-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/50" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Orders",
                  value: String(customer.stats.totalOrders),
                  icon: ShoppingBag,
                },
                {
                  label: "Total spent",
                  value: money(customer.stats.totalSpending),
                  icon: Wallet,
                },
                {
                  label: "Balance",
                  value: money(customer.balance),
                  icon: Wallet,
                },
                {
                  label: "Pending pay",
                  value: String(customer.stats.pendingPayments),
                  icon: ShoppingBag,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-gray-100 bg-white p-3 shadow-soft"
                >
                  <Icon className="mb-1 size-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-semibold tabular-nums">{value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Contact</p>
              <ContactRow
                icon={Phone}
                label="Phone"
                value={customer.phone}
                href={customer.phone ? `tel:${customer.phone}` : undefined}
              />
              <ContactRow
                icon={Mail}
                label="Email"
                value={displayEmail}
                href={displayEmail ? `mailto:${displayEmail}` : undefined}
              />
            </div>

            {customer.tags.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {customer.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {customer.notes && (
              <div className="rounded-xl border border-gray-100 bg-muted/20 p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>
                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}

            {customer.stats.favoriteProducts.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Star className="size-4 text-amber-500" />
                  Top products
                </p>
                <ul className="space-y-2">
                  {customer.stats.favoriteProducts.map((p) => (
                    <li
                      key={p.name}
                      className="flex justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm"
                    >
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {p.quantity} sold
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium">Recent orders</p>
              {customer.orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet</p>
              ) : (
                <ul className="space-y-2">
                  {customer.orders.slice(0, 8).map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm transition-colors hover:bg-brand-rose/30"
                        onClick={() => onOpenChange(false)}
                      >
                        <div>
                          <p className="font-medium">{orderRef(o)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(o.createdAt), "MMM d, yyyy")} ·{" "}
                            {o.paymentStatus.replace(/_/g, " ")}
                          </p>
                        </div>
                        <span className="font-semibold tabular-nums">
                          {money(o.totalAmount)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {customer.stats.lastPurchase && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="size-3.5" />
                Last purchase{" "}
                {format(new Date(customer.stats.lastPurchase), "MMM d, yyyy")}
              </p>
            )}
          </div>

              <div className="flex gap-2 border-t border-border/60 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Button
                  className="h-11 flex-1 gap-2 rounded-xl"
                  variant="outline"
                  disabled={!canSms}
                  onClick={() =>
                    openCustomerWhatsApp(customer.phone, customer.name, businessName)
                  }
                >
                  <MessageCircle className="size-4 text-emerald-600" />
                  WhatsApp
                </Button>
                <Button
                  className="h-11 flex-1 gap-2 rounded-xl"
                  variant="outline"
                  disabled={!canSms}
                  onClick={() => setSmsOpen(true)}
                >
                  <MessageSquare className="size-4" />
                  SMS
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {customer && (
      <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send SMS to {customer.name}</DialogTitle>
            <DialogDescription>
              {canSms
                ? `Message will be sent to ${customer.phone}`
                : "Add a phone number to send SMS"}
            </DialogDescription>
          </DialogHeader>
          <TextAreaField
            label="Message"
            value={message}
            onChange={setMessage}
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            {message.length}/480 characters · Requires SMS enabled in Settings
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSmsOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!message.trim() || smsMutation.isPending || !canSms}
              onClick={() => smsMutation.mutate()}
            >
              {smsMutation.isPending ? "Sending…" : "Send SMS"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </>
  );
}
