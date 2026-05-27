"use client";

import { format } from "date-fns";
import type { ReceiptModel } from "@/lib/receipt/types";
import { formatMoney } from "@/lib/receipt/build-receipt";
import { formatPaymentStatus } from "@/lib/orders/format";
import { cn } from "@/lib/utils";

type Props = {
  receipt: ReceiptModel;
  className?: string;
  /** Screen: friendly client receipt. POS/print: compact thermal. */
  variant?: "client" | "thermal";
  printMode?: boolean;
};

export function ReceiptView({
  receipt,
  className,
  variant = "thermal",
  printMode,
}: Props) {
  const isClient = variant === "client";
  const { config, business, customer, lines, totals } = receipt;
  const cur = business.currency;
  const thankYou =
    config.thankYouMessage || business.receiptFooter || "Thank you for your purchase!";
  const dateStr = format(new Date(receipt.createdAt), "EEE, MMM d yyyy · h:mm a");

  if (isClient) {
    return (
      <article
        className={cn(
          "mx-auto overflow-hidden bg-white font-sans text-foreground shadow-card",
          "max-w-md rounded-2xl border border-primary/10",
          printMode && "print:max-w-none print:rounded-none print:border-0 print:shadow-none",
          className,
        )}
      >
        {/* Header */}
        <header className="bg-gradient-to-br from-primary/40 via-brand-rose/50 to-brand-cream px-6 py-6 text-center">
          {config.showLogo && business.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logoUrl}
              alt=""
              className="mx-auto mb-3 h-12 object-contain"
            />
          )}
          <h1 className="text-lg font-bold tracking-tight">
            {config.headerText || business.name}
          </h1>
          {config.headerText && (
            <p className="mt-0.5 text-sm text-foreground/70">{business.name}</p>
          )}
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-foreground/60">
            Your receipt
          </p>
        </header>

        {/* Meta */}
        <div className="space-y-2 border-b border-primary/10 px-6 py-4 text-sm">
          <MetaRow label="Receipt" value={`#${receipt.orderRef}`} highlight />
          <MetaRow label="Date" value={dateStr} />
          <MetaRow label="Customer" value={customer.name} />
          {customer.phone && <MetaRow label="Phone" value={customer.phone} />}
          <MetaRow
            label="Payment"
            value={formatPaymentStatus(receipt.paymentStatus)}
          />
          {receipt.paymentMethod && (
            <MetaRow
              label="Method"
              value={receipt.paymentMethod.replace(/_/g, " ")}
            />
          )}
        </div>

        {/* Items */}
        <div className="px-6 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Items
          </p>
          <ul className="space-y-3">
            {lines.map((line, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-3 border-b border-primary/5 pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{line.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {line.quantity} × {formatMoney(cur, line.unitPrice)}
                  </p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums">
                  {formatMoney(cur, line.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Totals */}
        <div className="space-y-1.5 border-t border-primary/10 bg-brand-cream/30 px-6 py-4 text-sm">
          <TotalRow label="Subtotal" value={formatMoney(cur, totals.subtotal)} />
          {config.showTaxBreakdown && totals.discountAmount > 0 && (
            <TotalRow
              label="Discount"
              value={`−${formatMoney(cur, totals.discountAmount)}`}
            />
          )}
          {config.showTaxBreakdown && totals.taxAmount > 0 && (
            <TotalRow label="Tax" value={formatMoney(cur, totals.taxAmount)} />
          )}
          {totals.shippingAmount > 0 && (
            <TotalRow
              label="Delivery fee"
              value={formatMoney(cur, totals.shippingAmount)}
            />
          )}
          <div className="flex items-center justify-between border-t border-primary/10 pt-3">
            <span className="text-base font-bold">Total</span>
            <span className="text-xl font-bold tabular-nums text-primary">
              {formatMoney(cur, totals.total)}
            </span>
          </div>
          <TotalRow label="Paid" value={formatMoney(cur, totals.amountPaid)} muted />
          {totals.changeDue > 0 && (
            <TotalRow label="Change" value={formatMoney(cur, totals.changeDue)} muted />
          )}
        </div>

        <footer className="border-t border-primary/10 px-6 py-5 text-center">
          <p className="text-sm leading-relaxed text-muted-foreground">{thankYou}</p>
        </footer>
      </article>
    );
  }

  /* Thermal / POS layout */
  return (
    <article
      className={cn(
        "mx-auto bg-white font-sans text-[#1F1F1F]",
        config.paperSize === "58mm" ? "max-w-[58mm] text-[11px]" : "max-w-[80mm] text-xs",
        printMode && "print:max-w-none print:shadow-none",
        !printMode && "rounded-2xl border border-[#F1E7E4] shadow-soft",
        className,
      )}
    >
      <div className="border-b border-dashed border-[#F1E7E4] px-4 py-5 text-center">
        {config.showLogo && business.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logoUrl}
            alt=""
            className="mx-auto mb-3 h-10 object-contain"
          />
        )}
        <h1 className="text-sm font-bold uppercase tracking-wide">
          {config.headerText || business.name}
        </h1>
        {config.headerText && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{business.name}</p>
        )}
        <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Sales receipt
        </p>
      </div>

      <div className="space-y-1 border-b border-dashed border-[#F1E7E4] px-4 py-3 text-[10px]">
        <Row label="Receipt #" value={receipt.orderRef} />
        <Row label="Date" value={receipt.createdAt.toLocaleString()} />
        <Row label="Customer" value={customer.name} />
        {customer.phone && <Row label="Phone" value={customer.phone} />}
        <Row label="Payment" value={formatPaymentStatus(receipt.paymentStatus)} />
      </div>

      <table className="w-full px-4 py-3">
        <thead>
          <tr className="border-b border-[#F1E7E4] text-left text-[9px] uppercase text-muted-foreground">
            <th className="pb-1 font-medium">Item</th>
            <th className="pb-1 text-center font-medium">Qty</th>
            <th className="pb-1 text-right font-medium">Amt</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="border-b border-[#F1E7E4]/50 align-top">
              <td className="py-1.5 pr-1">
                <p className="font-medium leading-tight">{line.label}</p>
              </td>
              <td className="py-1.5 text-center tabular-nums">{line.quantity}</td>
              <td className="py-1.5 text-right tabular-nums">
                {line.lineTotal.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-0.5 border-t border-dashed border-[#F1E7E4] px-4 py-3 text-[10px]">
        <TotalRow label="Subtotal" value={formatMoney(cur, totals.subtotal)} />
        {totals.shippingAmount > 0 && (
          <TotalRow
            label="Delivery fee"
            value={formatMoney(cur, totals.shippingAmount)}
          />
        )}
        <div className="flex justify-between border-t border-[#F1E7E4] pt-2 text-sm font-bold">
          <span>TOTAL</span>
          <span className="tabular-nums">{formatMoney(cur, totals.total)}</span>
        </div>
        <TotalRow label="Paid" value={formatMoney(cur, totals.amountPaid)} />
      </div>

      <footer className="border-t border-dashed border-[#F1E7E4] px-4 py-4 text-center">
        <p className="text-[10px] leading-relaxed text-muted-foreground">{thankYou}</p>
      </footer>
    </article>
  );
}

function MetaRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right font-medium", highlight && "font-semibold")}>
        {value}
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function TotalRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between tabular-nums",
        muted && "text-muted-foreground",
      )}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
