"use client";

import { useState, useTransition } from "react";
import {
  refreshSplitSmsBalanceAction,
  type SplitSmsBalanceActionResult,
} from "@/app/admin/actions/settings";
import type { SplitSmsBalance } from "@/lib/splitsms";

type Props = {
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

export function SplitSmsBalancePanel({ initialBalance, initialError }: Props) {
  const [balance, setBalance] = useState(initialBalance);
  const [error, setError] = useState(initialError);
  const [pending, startTransition] = useTransition();

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
    <div className="admin-settings-balance">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold text-[#1d2327]">Account balance</h3>
          <p className="admin-field-hint mt-0.5">Wallet and SMS credits from SplitSMS</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {balance ? (
            <span
              className={`inline-flex rounded-[3px] px-1.5 py-0.5 text-[11px] font-semibold ${
                balance.sandbox
                  ? "bg-[#fcf9e8] text-[#996800]"
                  : "bg-[#edfaef] text-[#007017]"
              }`}
            >
              {balance.sandbox ? "Sandbox" : "Live"}
            </span>
          ) : null}
          <button
            type="button"
            onClick={refresh}
            disabled={pending}
            className="admin-button-secondary"
          >
            {pending ? "Refreshing…" : "Refresh balance"}
          </button>
        </div>
      </div>

      {balance ? (
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="admin-settings-balance-stat">
            <dt>SMS credits</dt>
            <dd>{balance.smsCredits.toLocaleString()}</dd>
          </div>
          <div className="admin-settings-balance-stat">
            <dt>Wallet</dt>
            <dd>{formatWalletAmount(balance.walletBalance, balance.currency)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-[13px] text-[#646970]">
          {error ?? "Balance unavailable. Check your API key has wallet.read permission."}
        </p>
      )}

      {error && balance ? (
        <p className="mt-3 text-[13px] text-[#b32d2e]">
          Last refresh failed: {error}. Showing previous values.
        </p>
      ) : null}
    </div>
  );
}
