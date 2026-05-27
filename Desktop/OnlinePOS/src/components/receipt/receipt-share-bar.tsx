"use client";

import {
  Check,
  Copy,
  Mail,
  MessageCircle,
  MessageSquare,
  Printer,
  Send,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ReceiptModel } from "@/lib/receipt/types";
import {
  buildEmailShareUrl,
  buildReceiptShareText,
  buildSmsShareUrl,
  buildWhatsAppShareUrl,
} from "@/lib/receipt/share";
import { cn } from "@/lib/utils";

type ShareAction = {
  id: string;
  label: string;
  icon: typeof Share2;
  iconTone: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
};

type Props = {
  receipt: ReceiptModel;
  onSendSms?: () => void;
  onSendEmail?: () => void;
  onSendBoth?: () => void;
  sending?: boolean;
  className?: string;
};

export function ReceiptShareBar({
  receipt,
  onSendSms,
  onSendEmail,
  onSendBoth,
  sending,
  className,
}: Props) {
  const [copied, setCopied] = useState(false);
  const shareText = buildReceiptShareText(receipt);
  const subject = `${receipt.business.name} — Receipt ${receipt.orderRef}`;

  async function copyText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("Receipt copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: subject, text: shareText });
      } catch (e) {
        if ((e as Error).name !== "AbortError") toast.error("Share cancelled");
      }
    } else {
      await copyText();
    }
  }

  function openUrl(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const actions: ShareAction[] = [
    {
      id: "share",
      label: "Share",
      icon: Share2,
      iconTone: "bg-primary text-primary-foreground",
      onClick: nativeShare,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      iconTone: "bg-emerald-500 text-white",
      onClick: () =>
        openUrl(buildWhatsAppShareUrl(shareText, receipt.customer.phone)),
    },
    {
      id: "copy",
      label: copied ? "Copied" : "Copy",
      icon: copied ? Check : Copy,
      iconTone: copied ? "bg-emerald-500 text-white" : "bg-violet-500 text-white",
      onClick: copyText,
    },
    {
      id: "sms",
      label: "SMS",
      icon: MessageSquare,
      iconTone: "bg-sky-500 text-white",
      onClick:
        onSendSms ??
        (() => openUrl(buildSmsShareUrl(shareText, receipt.customer.phone))),
      disabled: sending,
    },
    {
      id: "email",
      label: "Email",
      icon: Mail,
      iconTone: "bg-orange-500 text-white",
      onClick:
        onSendEmail ??
        (() =>
          openUrl(
            buildEmailShareUrl(subject, shareText, receipt.customer.email),
          )),
      disabled: sending,
    },
    {
      id: "print",
      label: "Print",
      icon: Printer,
      iconTone: "bg-slate-600 text-white",
      onClick: () => window.print(),
    },
    ...(onSendBoth
      ? [
          {
            id: "send-both",
            label: "Send",
            icon: Send,
            iconTone: "bg-foreground text-background",
            onClick: onSendBoth,
            disabled: sending,
          } satisfies ShareAction,
        ]
      : []),
  ];

  const colCount = actions.length;

  return (
    <div
      className={cn(
        "print:hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/25 via-brand-rose/45 to-brand-cream/80 p-2.5 shadow-soft sm:p-3",
        className,
      )}
    >
      <div
        className="grid w-full gap-1 sm:gap-1.5"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {actions.map(({ id, label, icon: Icon, iconTone, onClick, disabled }) => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => void onClick()}
            title={label}
            aria-label={label}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-xl border border-white/60 bg-white/90 px-0.5 py-2 shadow-sm transition-all touch-manipulation",
              "hover:bg-white hover:shadow-md active:scale-[0.98]",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full shadow-sm sm:size-8",
                iconTone,
              )}
            >
              <Icon className="size-3.5 sm:size-4" strokeWidth={2} />
            </span>
            <span className="w-full truncate text-center text-[9px] font-semibold leading-tight text-foreground sm:text-[10px]">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
