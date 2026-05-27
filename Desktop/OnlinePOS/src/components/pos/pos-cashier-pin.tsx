"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { capitalizeLabel } from "@/lib/format-label";
import { parseApiResponse } from "@/lib/api-client";
import { usePosCashier, type ActiveCashier } from "@/stores/pos-cashier";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  required?: boolean;
  onVerified?: (cashier: ActiveCashier) => void;
};

export function PosCashierPinDialog({
  open,
  onOpenChange,
  required,
  onVerified,
}: Props) {
  const setCashier = usePosCashier((s) => s.setCashier);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPin("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  async function submit() {
    if (pin.length < 4) {
      setError("Enter at least 4 digits");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pos/cashier/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await parseApiResponse<{
        cashier: ActiveCashier;
        token: string;
      }>(res);
      setCashier(data.cashier, data.token);
      onVerified?.(data.cashier);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid PIN");
      setPin("");
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (required && !next) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={!required}
        className="rounded-2xl border-primary/20 sm:max-w-sm"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRound className="size-5 text-primary" />
            {capitalizeLabel("Cashier PIN")}
          </DialogTitle>
          <DialogDescription>
            {capitalizeLabel(
              required
                ? "Enter your PIN to start selling on this register."
                : "Enter PIN to switch cashier.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            placeholder="••••"
            className="h-12 rounded-xl text-center text-lg tracking-[0.35em]"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
          />
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
          <Button
            className="h-11 w-full rounded-xl"
            disabled={loading || pin.length < 4}
            onClick={() => void submit()}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {capitalizeLabel("Verifying…")}
              </>
            ) : (
              capitalizeLabel("Continue")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
