"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { HiArrowPath, HiChatBubbleBottomCenterText } from "react-icons/hi2";
import {
  refreshSplitSmsBalanceAction,
  type SplitSmsBalanceActionResult,
} from "@/app/admin/actions/settings";
import type { SplitSmsBalance } from "@/lib/splitsms";
import type { StaffRole } from "@/lib/supabase/auth";

type Props = {
  role: StaffRole;
  splitsmsReady: boolean;
  initialBalance: SplitSmsBalance | null;
  initialError: string | null;
};

function formatWalletAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

export function AdminHeaderSmsBalance({
  role,
  splitsmsReady,
  initialBalance,
  initialError,
}: Props) {
  const [balance, setBalance] = useState(initialBalance);
  const [error, setError] = useState(initialError);
  const [pending, startTransition] = useTransition();

  if (!splitsmsReady) {
    if (role !== "admin") return null;

    return (
      <Link href="/admin/settings" className="admin-bar-sms admin-bar-sms-muted">
        <HiChatBubbleBottomCenterText className="admin-bar-sms-icon" aria-hidden />
        <span>Configure SMS</span>
      </Link>
    );
  }

  function refresh() {
    startTransition(async () => {
      const result: SplitSmsBalanceActionResult = await refreshSplitSmsBalanceAction();
      if (result.success) {
        setBalance(result.balance);
        setError(null);
        return;
      }
      setError(result.error);
    });
  }

  return (
    <div className="admin-bar-sms" title={error ?? undefined}>
      <HiChatBubbleBottomCenterText className="admin-bar-sms-icon" aria-hidden />

      {balance ? (
        <>
          <span className="admin-bar-sms-credits">
            {balance.smsCredits.toLocaleString()} SMS
          </span>
          <span className="admin-bar-sms-separator" aria-hidden>
            ·
          </span>
          <span className="admin-bar-sms-wallet hidden lg:inline">
            {formatWalletAmount(balance.walletBalance, balance.currency)}
          </span>
          <span
            className={`admin-bar-sms-badge ${
              balance.sandbox ? "admin-bar-sms-badge-sandbox" : "admin-bar-sms-badge-live"
            }`}
          >
            {balance.sandbox ? "Sandbox" : "Live"}
          </span>
        </>
      ) : (
        <span className="admin-bar-sms-unavailable">
          {error ? "SMS balance unavailable" : "Loading SMS…"}
        </span>
      )}

      {role === "admin" ? (
        <button
          type="button"
          onClick={refresh}
          disabled={pending}
          className="admin-bar-sms-refresh"
          aria-label="Refresh SMS balance"
          title="Refresh SMS balance"
        >
          <HiArrowPath className={pending ? "animate-spin" : ""} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
