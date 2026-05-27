"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Receipt, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { ReceiptShareBar } from "@/components/receipt/receipt-share-bar";
import { ReceiptView } from "@/components/receipt/receipt-view";
import { PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { parseApiResponse } from "@/lib/api-client";
import type { ReceiptDeliveryResult, ReceiptModel } from "@/lib/receipt/types";
import { cn } from "@/lib/utils";

export default function ReceiptPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["receipt", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/receipt`);
      return parseApiResponse<{ receipt: ReceiptModel }>(res);
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (channel: "sms" | "email" | "both") => {
      const res = await fetch(`/api/orders/${orderId}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forceSms: channel === "sms" || channel === "both",
          forceEmail: channel === "email" || channel === "both",
        }),
      });
      return parseApiResponse<ReceiptDeliveryResult>(res);
    },
    onSuccess: (d) => {
      if (d.sms.sent || d.email.sent) toast.success("Receipt sent to customer");
      else {
        toast.error(
          [d.sms.error, d.email.error].filter(Boolean).join(" · ") ||
            "Could not send receipt",
        );
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <PageShell className="mx-auto max-w-lg space-y-5 py-8 pb-10 print:max-w-none print:p-0">
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-2xl bg-gradient-to-br from-brand-cream/80 to-brand-rose/30" />
          <div className="h-96 animate-pulse rounded-2xl bg-muted/30" />
        </div>
      </PageShell>
    );
  }

  if (isError || !data?.receipt) {
    return (
      <PageShell className="mx-auto max-w-lg py-12 text-center">
        <p className="font-medium text-destructive">Receipt not found</p>
        <Link
          href={`/dashboard/orders/${orderId}`}
          className={cn(buttonVariants({ variant: "outline" }), "mt-4 rounded-xl")}
        >
          Back to order
        </Link>
      </PageShell>
    );
  }

  const receipt = data.receipt;
  const sending = resendMutation.isPending;

  return (
    <PageShell className="mx-auto max-w-lg space-y-5 pb-10 print:max-w-none print:p-0">
      {/* Header — hidden when printing */}
      <header className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/35 via-brand-rose/45 to-brand-cream px-4 py-5 shadow-soft print:hidden sm:px-6">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Receipt className="size-5 text-primary-foreground" />
            </span>
            <div>
              <Link
                href={`/dashboard/orders/${orderId}`}
                className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-foreground/60 hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Back to order
              </Link>
              <h1 className="text-xl font-bold tracking-tight">
                Receipt #{receipt.orderRef}
              </h1>
              <p className="text-sm text-foreground/70">{receipt.customer.name}</p>
            </div>
          </div>
          <Link
            href="/dashboard/settings/pos-receipt"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "shrink-0 rounded-xl border-primary/20 bg-white/80",
            })}
          >
            <Settings2 className="mr-1.5 size-4" />
            Customize
          </Link>
        </div>
      </header>

      <ReceiptShareBar
        receipt={receipt}
        sending={sending}
        onSendSms={() => resendMutation.mutate("sms")}
        onSendEmail={() => resendMutation.mutate("email")}
        onSendBoth={() => resendMutation.mutate("both")}
      />

      {/* Client-friendly receipt */}
      <ReceiptView receipt={receipt} variant="client" printMode />
    </PageShell>
  );
}
