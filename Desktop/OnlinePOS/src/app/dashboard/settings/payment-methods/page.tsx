"use client";

import { SettingsPageShell } from "@/components/settings/settings-shell";
import { Toggle } from "@/components/settings/fields";

export default function PaymentMethodsSettingsPage() {
  return (
    <SettingsPageShell
      title="Payment methods"
      description="Methods available at POS and on orders"
      section="paymentMethods"
    >
      {(s, u) => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Cash"
            checked={s.paymentMethods.cash}
            onChange={(v) => u({ cash: v })}
          />
          <Toggle
            label="Mobile Money"
            checked={s.paymentMethods.momo}
            onChange={(v) => u({ momo: v })}
          />
          <Toggle
            label="Bank transfer"
            checked={s.paymentMethods.bankTransfer}
            onChange={(v) => u({ bankTransfer: v })}
          />
          <Toggle
            label="Card"
            checked={s.paymentMethods.card}
            onChange={(v) => u({ card: v })}
          />
          <Toggle
            label="Pay later"
            checked={s.paymentMethods.payLater}
            onChange={(v) => u({ payLater: v })}
          />
        </div>
      )}
    </SettingsPageShell>
  );
}
