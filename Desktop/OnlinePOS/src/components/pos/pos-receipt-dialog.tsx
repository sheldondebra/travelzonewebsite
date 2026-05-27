"use client";

import { useQuery } from "@tanstack/react-query";
import { Mail, MessageSquare, Printer, RotateCcw, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReceiptView } from "@/components/receipt/receipt-view";
import { parseApiResponse } from "@/lib/api-client";
import type { ReceiptDeliveryResult } from "@/lib/receipt/types";
import type { ReceiptModel } from "@/lib/receipt/types";
import { cn } from "@/lib/utils";

type Props = {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDelivery?: ReceiptDeliveryResult | null;
};

export function PosReceiptDialog({
  orderId,
  open,
  onOpenChange,
  initialDelivery,
}: Props) {
  const [delivery, setDelivery] = useState<ReceiptDeliveryResult | null>(
    initialDelivery ?? null,
  );
  const [resending, setResending] = useState(false);
  const [voiding, setVoiding] = useState(false);

  useEffect(() => {
    if (open && initialDelivery) setDelivery(initialDelivery);
  }, [open, initialDelivery]);

  const { data, isLoading } = useQuery({
    queryKey: ["pos-receipt", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/receipt`);
      return parseApiResponse<{ receipt: ReceiptModel }>(res);
    },
    enabled: open && !!orderId,
  });

  async function resend(channel: "sms" | "email" | "both") {
    if (!orderId) return;
    setResending(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forceSms: channel === "sms" || channel === "both",
          forceEmail: channel === "email" || channel === "both",
        }),
      });
      const result = await parseApiResponse<ReceiptDeliveryResult>(res);
      setDelivery(result);
      if (result.sms.sent || result.email.sent) {
        toast.success("Receipt sent to customer");
      } else {
        toast.error(
          [result.sms.error, result.email.error].filter(Boolean).join(" · ") ||
            "Could not send receipt",
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setResending(false);
    }
  }

  async function voidSale() {
    if (!orderId) return;
    setVoiding(true);
    try {
      const res = await fetch("/api/pos/sales/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "void", reason: "POS void" }),
      });
      await parseApiResponse(res);
      toast.success("Sale voided and stock restored");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Void failed");
    } finally {
      setVoiding(false);
    }
  }

  const receipt = data?.receipt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-[#F1E7E4] bg-brand-rose/40 px-5 py-4 text-left">
          <DialogTitle>Sale complete</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Receipt preview · sent to customer when SMS/email is enabled
          </p>
        </DialogHeader>

        {(delivery || initialDelivery) && (
          <DeliveryStatus delivery={delivery ?? initialDelivery!} />
        )}

        <div className="max-h-[50vh] overflow-y-auto bg-[#FFF8F5] p-4">
          {isLoading || !receipt ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading receipt…
            </p>
          ) : (
            <ReceiptView receipt={receipt} />
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-[#F1E7E4] bg-white p-4">
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => window.print()}
            disabled={!receipt}
          >
            <Printer className="mr-2 size-4" />
            Print
          </Button>
          <Button
            variant="outline"
            disabled={resending || !orderId}
            onClick={() => resend("sms")}
          >
            <MessageSquare className="mr-2 size-4" />
            SMS
          </Button>
          <Button
            variant="outline"
            disabled={resending || !orderId}
            onClick={() => resend("email")}
          >
            <Mail className="mr-2 size-4" />
            Email
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            disabled={voiding || !orderId}
            onClick={() => void voidSale()}
          >
            <RotateCcw className="mr-2 size-4" />
            Void sale
          </Button>
          <Button
            className="w-full"
            disabled={resending || !orderId}
            onClick={() => resend("both")}
          >
            <Send className="mr-2 size-4" />
            Resend SMS & email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryStatus({ delivery }: { delivery: ReceiptDeliveryResult }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-[#F1E7E4] bg-white px-4 py-3">
      <StatusPill
        label="SMS"
        sent={delivery.sms.sent}
        attempted={delivery.sms.attempted}
        error={delivery.sms.error}
      />
      <StatusPill
        label="Email"
        sent={delivery.email.sent}
        attempted={delivery.email.attempted}
        error={delivery.email.error}
      />
    </div>
  );
}

function StatusPill({
  label,
  sent,
  attempted,
  error,
}: {
  label: string;
  sent: boolean;
  attempted: boolean;
  error?: string;
}) {
  if (!attempted) {
    return (
      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
        {label}: off
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        sent
          ? "bg-green-100 text-green-800"
          : "bg-amber-100 text-amber-900",
      )}
      title={error}
    >
      {label}: {sent ? "sent" : "failed"}
    </span>
  );
}
