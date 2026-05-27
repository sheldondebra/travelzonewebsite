"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Receipt, Trash2, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { pos } from "@/components/pos/pos-styles";
import {
  getEnabledPaymentMethods,
  type PaymentMethodOption,
} from "@/lib/settings/helpers";
import { capitalizeLabel } from "@/lib/format-label";
import type { BusinessSettings } from "@/lib/settings/defaults";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grandTotal: number;
  currency: string;
  itemCount: number;
  paymentMethods?: BusinessSettings["paymentMethods"];
  defaultPaymentMethod?: string;
  allowPayLater?: boolean;
  formatMoney?: (amount: number) => string;
  onComplete: (data: {
    paymentMethod: string;
    paymentStatus: string;
    amountPaid: number;
    changeDue?: number;
    momoReference?: string;
    momoNetwork?: string;
    payments?: Array<{
      method: string;
      amount: number;
      reference?: string;
      network?: string;
    }>;
  }) => void;
  loading?: boolean;
};

const MOMO_NETWORKS = ["MTN", "Vodafone", "AirtelTigo"] as const;

function fmtAmount(
  amount: number,
  currency: string,
  formatMoney?: (n: number) => string,
) {
  return formatMoney ? formatMoney(amount) : `${currency} ${amount.toFixed(2)}`;
}

export function PosPaymentDialog({
  open,
  onOpenChange,
  grandTotal,
  currency,
  itemCount,
  paymentMethods,
  defaultPaymentMethod = "CASH",
  allowPayLater = true,
  formatMoney,
  onComplete,
  loading,
}: Props) {
  const methods = useMemo<PaymentMethodOption[]>(
    () =>
      paymentMethods
        ? getEnabledPaymentMethods(paymentMethods)
        : getEnabledPaymentMethods({
            cash: true,
            momo: true,
            bankTransfer: true,
            card: true,
            payLater: true,
          }),
    [paymentMethods],
  );

  const initialMethod = methods.some((m) => m.value === defaultPaymentMethod)
    ? defaultPaymentMethod
    : methods[0]?.value ?? "CASH";

  const [method, setMethod] = useState<string>(initialMethod);
  const [amountPaid, setAmountPaid] = useState(String(grandTotal));
  const [payLater, setPayLater] = useState(false);
  const [partial, setPartial] = useState(false);
  const [splitMode, setSplitMode] = useState(false);
  const [momoRef, setMomoRef] = useState("");
  const [momoNet, setMomoNet] = useState("MTN");
  const [splitLines, setSplitLines] = useState([
    { id: "1", method: initialMethod, amount: String(grandTotal), reference: "", network: "MTN" },
  ]);

  const splitTotal = splitLines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const paid = splitMode ? splitTotal : Number(amountPaid) || 0;
  const changeDue = Math.max(0, paid - grandTotal);
  const balanceDue = Math.max(0, grandTotal - paid);
  const showMomo = !splitMode && method === "MOMO" && !payLater;
  const showAmount = !payLater && !splitMode;

  useEffect(() => {
    if (open) {
      setMethod(initialMethod);
      setPayLater(false);
      setPartial(false);
      setSplitMode(false);
      setAmountPaid(String(grandTotal.toFixed(2)));
      setSplitLines([
        {
          id: "1",
          method: initialMethod,
          amount: String(grandTotal.toFixed(2)),
          reference: "",
          network: "MTN",
        },
      ]);
      setMomoRef("");
      setMomoNet("MTN");
    }
  }, [open, grandTotal, initialMethod]);

  useEffect(() => {
    if (payLater) {
      setPartial(false);
      setSplitMode(false);
    }
  }, [payLater]);

  function handleComplete() {
    let paymentStatus = "paid";
    if (payLater) paymentStatus = "pending";
    else if (partial && paid < grandTotal) paymentStatus = "partially_paid";
    else if (paid < grandTotal) paymentStatus = "partially_paid";

    if (splitMode && splitLines.length > 0) {
      const payments = splitLines.map((line) => ({
        method: line.method,
        amount: Number(line.amount) || 0,
        reference: line.method === "MOMO" ? line.reference || undefined : undefined,
        network: line.method === "MOMO" ? line.network : undefined,
      }));
      const cashLine = payments.find((p) => p.method === "CASH");
      let changeDue = 0;
      if (cashLine) {
        const nonCash = payments
          .filter((p) => p.method !== "CASH")
          .reduce((s, p) => s + p.amount, 0);
        const cashDue = Math.max(0, grandTotal - nonCash);
        changeDue = Math.max(0, cashLine.amount - cashDue);
      }
      onComplete({
        paymentMethod: payments.length > 1 ? "SPLIT" : payments[0].method,
        paymentStatus,
        amountPaid: paid,
        changeDue,
        payments,
      });
      return;
    }

    onComplete({
      paymentMethod: method,
      paymentStatus,
      amountPaid: payLater ? 0 : paid,
      changeDue: method === "CASH" ? changeDue : 0,
      momoReference: method === "MOMO" ? momoRef : undefined,
      momoNetwork: method === "MOMO" ? momoNet : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="gap-0 overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-b from-brand-cream via-brand-rose/35 to-primary/25 p-0 shadow-elevated sm:max-w-[420px] [&_[data-slot=dialog-close]]:top-3 [&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:bg-white/90 [&_[data-slot=dialog-close]]:shadow-sm hover:[&_[data-slot=dialog-close]]:bg-white"
      >
        <DialogHeader className="border-b border-primary/15 bg-primary/20 px-4 pb-3 pt-4 pr-12 text-left">
          <DialogTitle className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-sm font-bold tracking-tight">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
                <Wallet className="size-4 text-primary-foreground" />
              </span>
              <span className="min-w-0">{capitalizeLabel("Complete payment")}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-[10px] font-medium uppercase tracking-wider text-foreground/70">
                {capitalizeLabel("Total")}
              </span>
              <span className="text-xl font-bold tabular-nums tracking-tight">
                {fmtAmount(grandTotal, currency, formatMoney)}
              </span>
            </span>
          </DialogTitle>
          <DialogDescription className="text-[11px] text-foreground/70">
            {capitalizeLabel(
              `${itemCount} item${itemCount === 1 ? "" : "s"} in this sale`,
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-4 py-3">
          <section>
            <p className={cn(pos.sectionLabel, "mb-1.5")}>
              {capitalizeLabel("Payment method")}
            </p>
            {!splitMode ? (
            <RadioGroup
              value={method}
              onValueChange={(value) => setMethod(String(value))}
              className="grid grid-cols-2 gap-1.5"
            >
              {methods.map((m) => {
                const Icon = m.icon;
                const active = method === m.value;
                return (
                  <label
                    key={m.value}
                    htmlFor={`pay-method-${m.value}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 transition-all",
                      active
                        ? "border-primary bg-primary/35 shadow-soft ring-1 ring-primary/40"
                        : "border-primary/15 bg-white/75 hover:border-primary/30 hover:bg-white/90",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-brand-rose/50 text-foreground/70",
                      )}
                    >
                      <Icon className="size-3.5" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                      {capitalizeLabel(m.label)}
                    </span>
                    <Radio id={`pay-method-${m.value}`} value={m.value} className="size-4" />
                  </label>
                );
              })}
            </RadioGroup>
            ) : (
              <p className="rounded-xl border border-primary/15 bg-white/70 px-3 py-2 text-xs text-muted-foreground">
                {capitalizeLabel("Configure each split line below")}
              </p>
            )}
          </section>

          <section className="rounded-xl border border-primary/15 bg-white/70 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {allowPayLater && (
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <Label htmlFor="pay-later" className="cursor-pointer text-xs font-semibold">
                    {capitalizeLabel("Pay later")}
                  </Label>
                  <Switch id="pay-later" checked={payLater} onCheckedChange={setPayLater} />
                </div>
              )}
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-between gap-2",
                  allowPayLater && "border-l border-primary/15 pl-3",
                )}
              >
                <Label
                  htmlFor="partial-payment"
                  className={cn(
                    "cursor-pointer text-xs font-semibold",
                    payLater && "opacity-50",
                  )}
                >
                  {capitalizeLabel("Partial")}
                </Label>
                <Switch
                  id="partial-payment"
                  checked={partial}
                  onCheckedChange={setPartial}
                  disabled={payLater}
                />
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2 border-l border-primary/15 pl-3">
                <Label
                  htmlFor="split-payment"
                  className={cn(
                    "cursor-pointer text-xs font-semibold",
                    payLater && "opacity-50",
                  )}
                >
                  {capitalizeLabel("Split pay")}
                </Label>
                <Switch
                  id="split-payment"
                  checked={splitMode}
                  onCheckedChange={setSplitMode}
                  disabled={payLater}
                />
              </div>
            </div>
          </section>

          {splitMode && !payLater && (
            <section className="rounded-xl border border-primary/15 bg-white/70 p-2.5">
              <p className={cn(pos.sectionLabel, "mb-2")}>
                {capitalizeLabel("Split payments")}
              </p>
              <div className="space-y-2">
                {splitLines.map((line) => (
                  <div key={line.id} className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
                    <select
                      className="h-9 rounded-lg border border-primary/20 bg-brand-cream/60 px-2 text-xs font-medium"
                      value={line.method}
                      onChange={(e) =>
                        setSplitLines((rows) =>
                          rows.map((r) =>
                            r.id === line.id ? { ...r, method: e.target.value } : r,
                          ),
                        )
                      }
                    >
                      {methods.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="h-9 rounded-lg border-primary/20 bg-brand-cream/60 text-xs"
                      value={line.amount}
                      onChange={(e) =>
                        setSplitLines((rows) =>
                          rows.map((r) =>
                            r.id === line.id ? { ...r, amount: e.target.value } : r,
                          ),
                        )
                      }
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-9 shrink-0"
                      disabled={splitLines.length <= 1}
                      onClick={() =>
                        setSplitLines((rows) => rows.filter((r) => r.id !== line.id))
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                    {line.method === "MOMO" && (
                      <Input
                        placeholder={capitalizeLabel("MoMo ref")}
                        className="col-span-3 h-8 rounded-lg border-primary/20 bg-brand-cream/60 text-xs"
                        value={line.reference}
                        onChange={(e) =>
                          setSplitLines((rows) =>
                            rows.map((r) =>
                              r.id === line.id ? { ...r, reference: e.target.value } : r,
                            ),
                          )
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  onClick={() =>
                    setSplitLines((rows) => [
                      ...rows,
                      {
                        id: crypto.randomUUID(),
                        method: "CASH",
                        amount: "0",
                        reference: "",
                        network: "MTN",
                      },
                    ])
                  }
                >
                  <Plus className="size-3.5" />
                  {capitalizeLabel("Add payment")}
                </Button>
                <p className="text-[11px] font-medium tabular-nums text-foreground/80">
                  {capitalizeLabel("Allocated")}: {fmtAmount(splitTotal, currency, formatMoney)}
                </p>
              </div>
            </section>
          )}

          {showAmount && (
            <section className="rounded-xl border border-primary/15 bg-white/70 p-2.5">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className={pos.sectionLabel}>{capitalizeLabel("Amount received")}</p>
                <div className="flex gap-1">
                  {[
                    { key: "exact", label: capitalizeLabel("Exact"), amount: grandTotal.toFixed(2) },
                    { key: "half", label: capitalizeLabel("Half"), amount: (grandTotal / 2).toFixed(2) },
                  ].map((chip) => {
                    const active = amountPaid === chip.amount;
                    return (
                      <Button
                        key={chip.key}
                        type="button"
                        variant={active ? "default" : "outline"}
                        size="xs"
                        className={cn(
                          "h-7 rounded-full px-2.5 text-[10px] font-semibold",
                          !active && "border-primary/20 bg-brand-cream/80",
                        )}
                        onClick={() => setAmountPaid(chip.amount)}
                      >
                        {chip.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="h-10 rounded-xl border-primary/20 bg-brand-cream/60 text-center text-base font-bold tabular-nums"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
              {paid >= grandTotal && method === "CASH" && changeDue > 0 && (
                <p className="mt-1.5 text-center text-[11px] font-medium text-emerald-800">
                  {capitalizeLabel(
                    `Change: ${fmtAmount(changeDue, currency, formatMoney)}`,
                  )}
                </p>
              )}
              {paid < grandTotal && paid > 0 && (
                <p className="mt-1.5 text-center text-[11px] font-medium text-amber-900">
                  {capitalizeLabel(
                    `Balance: ${fmtAmount(balanceDue, currency, formatMoney)}`,
                  )}
                </p>
              )}
            </section>
          )}

          {showMomo && (
            <section className="rounded-xl border border-primary/15 bg-white/70 p-2.5">
              <p className={cn(pos.sectionLabel, "mb-1.5")}>
                {capitalizeLabel("Mobile money")}
              </p>
              <RadioGroup
                value={momoNet}
                onValueChange={(value) => setMomoNet(String(value))}
                className="mb-2 grid grid-cols-3 gap-1.5"
              >
                {MOMO_NETWORKS.map((net) => {
                  const active = momoNet === net;
                  return (
                    <label
                      key={net}
                      htmlFor={`momo-${net}`}
                      className={cn(
                        "flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[10px] font-semibold transition-all",
                        active
                          ? "border-primary bg-primary/35 text-foreground ring-1 ring-primary/30"
                          : "border-primary/15 bg-brand-cream/70 text-foreground/80",
                      )}
                    >
                      <Radio id={`momo-${net}`} value={net} className="size-3.5" />
                      {net}
                    </label>
                  );
                })}
              </RadioGroup>
              <Input
                id="momo-ref"
                placeholder={capitalizeLabel("Reference (optional)")}
                className="h-9 rounded-xl border-primary/20 bg-brand-cream/60 text-sm"
                value={momoRef}
                onChange={(e) => setMomoRef(e.target.value)}
              />
            </section>
          )}
        </div>

        <div className="border-t border-primary/15 bg-primary/15 px-4 py-3">
          <Button
            className="h-11 w-full rounded-xl text-sm font-bold shadow-soft"
            onClick={handleComplete}
            disabled={loading || methods.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {capitalizeLabel("Processing sale…")}
              </>
            ) : (
              <>
                <Receipt className="size-4" />
                {capitalizeLabel("Complete sale")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
