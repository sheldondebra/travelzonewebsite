"use client";

import { useState } from "react";
import { Loader2, Lock, Unlock } from "lucide-react";
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
import { capitalizeLabel } from "@/lib/format-label";

type RegisterSession = {
  id: string;
  openingFloat: number;
  expectedCash: number;
  status: string;
  cashier?: { name: string | null } | null;
};

export function PosRegisterOpenDialog({
  open,
  loading,
  onOpen,
  errorMessage,
}: {
  open: boolean;
  loading?: boolean;
  onOpen: (openingFloat: number) => void;
  errorMessage?: string | null;
}) {
  const [float, setFloat] = useState("0");

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="rounded-2xl border-primary/20 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="size-5 text-primary" />
            {capitalizeLabel("Open register")}
          </DialogTitle>
          <DialogDescription>
            {capitalizeLabel(
              "Enter your opening float to start accepting sales on this register.",
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="opening-float">{capitalizeLabel("Opening float")}</Label>
            {errorMessage && (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {errorMessage}
              </p>
            )}
            <Input
              id="opening-float"
              type="number"
              min={0}
              step="0.01"
              className="mt-1.5 h-11 rounded-xl"
              value={float}
              onChange={(e) => setFloat(e.target.value)}
            />
          </div>
          <Button
            className="h-11 w-full rounded-xl"
            disabled={loading}
            onClick={() => onOpen(Number(float) || 0)}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {capitalizeLabel("Opening…")}
              </>
            ) : (
              capitalizeLabel("Open register")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PosRegisterCloseDialog({
  open,
  onOpenChange,
  session,
  formatMoney,
  loading,
  onClose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: RegisterSession | null;
  formatMoney: (n: number) => string;
  loading?: boolean;
  onClose: (countedCash: number, note?: string) => void;
}) {
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-primary/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-5 text-primary" />
            {capitalizeLabel("Close register")}
          </DialogTitle>
          <DialogDescription>
            {capitalizeLabel(
              `Expected cash: ${formatMoney(session.expectedCash)}`,
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="counted-cash">{capitalizeLabel("Counted cash")}</Label>
            <Input
              id="counted-cash"
              type="number"
              min={0}
              step="0.01"
              className="mt-1.5 h-11 rounded-xl"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="closing-note">{capitalizeLabel("Note (optional)")}</Label>
            <Input
              id="closing-note"
              className="mt-1.5 h-11 rounded-xl"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <Button
            className="h-11 w-full rounded-xl"
            disabled={loading || !counted}
            onClick={() => onClose(Number(counted) || 0, note || undefined)}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {capitalizeLabel("Closing…")}
              </>
            ) : (
              capitalizeLabel("Close register")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PosCashMovementDialog({
  open,
  onOpenChange,
  loading,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onSubmit: (data: {
    type: "CASH_IN" | "CASH_OUT";
    amount: number;
    reason: string;
  }) => void;
}) {
  const [type, setType] = useState<"CASH_IN" | "CASH_OUT">("CASH_IN");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-primary/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{capitalizeLabel("Cash in / out")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(["CASH_IN", "CASH_OUT"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant={type === t ? "default" : "outline"}
                className="rounded-xl"
                onClick={() => setType(t)}
              >
                {capitalizeLabel(t === "CASH_IN" ? "Cash in" : "Cash out")}
              </Button>
            ))}
          </div>
          <div>
            <Label>{capitalizeLabel("Amount")}</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              className="mt-1.5 h-11 rounded-xl"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label>{capitalizeLabel("Reason")}</Label>
            <Input
              className="mt-1.5 h-11 rounded-xl"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button
            className="h-11 w-full rounded-xl"
            disabled={loading || !amount || !reason.trim()}
            onClick={() =>
              onSubmit({
                type,
                amount: Number(amount) || 0,
                reason: reason.trim(),
              })
            }
          >
            {capitalizeLabel("Record movement")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PosRegisterReportDialog({
  open,
  onOpenChange,
  report,
  formatMoney,
  loading,
  onGenerate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: {
    type: string;
    salesCount: number;
    totalSales: number;
    cashSales: number;
    cashIn: number;
    cashOut: number;
    session: { openingFloat: number; expectedCash: number };
    paymentTotals: Record<string, number>;
  } | null;
  formatMoney: (n: number) => string;
  loading?: boolean;
  onGenerate: (type: "X" | "Z") => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-primary/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{capitalizeLabel("Register report")}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            disabled={loading}
            onClick={() => onGenerate("X")}
          >
            {capitalizeLabel("X report")}
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            disabled={loading}
            onClick={() => onGenerate("Z")}
          >
            {capitalizeLabel("Z report")}
          </Button>
        </div>
        {report && (
          <dl className="mt-3 space-y-2 rounded-xl border border-primary/15 bg-brand-cream/50 p-3 text-sm">
            <div className="flex justify-between">
              <dt>{capitalizeLabel("Sales")}</dt>
              <dd className="font-semibold">{report.salesCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{capitalizeLabel("Total sales")}</dt>
              <dd className="font-semibold">{formatMoney(report.totalSales)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{capitalizeLabel("Cash sales")}</dt>
              <dd>{formatMoney(report.cashSales)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{capitalizeLabel("Cash in")}</dt>
              <dd>{formatMoney(report.cashIn)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{capitalizeLabel("Cash out")}</dt>
              <dd>{formatMoney(report.cashOut)}</dd>
            </div>
            <div className="flex justify-between border-t border-primary/15 pt-2">
              <dt>{capitalizeLabel("Expected cash")}</dt>
              <dd className="font-bold">{formatMoney(report.session.expectedCash)}</dd>
            </div>
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}

export type { RegisterSession };
