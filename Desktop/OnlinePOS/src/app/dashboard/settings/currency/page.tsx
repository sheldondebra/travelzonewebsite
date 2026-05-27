"use client";

import { SettingsPageShell } from "@/components/settings/settings-shell";
import { SelectField, TextField } from "@/components/settings/fields";

export default function CurrencySettingsPage() {
  return (
    <SettingsPageShell
      title="Currency"
      description="Display format for prices across the app"
      section="currency"
    >
      {(s, u) => (
        <>
          <TextField
            label="Currency code"
            value={s.currency.code}
            onChange={(v) => u({ code: v })}
            placeholder="GHS"
          />
          <TextField
            label="Symbol"
            value={s.currency.symbol}
            onChange={(v) => u({ symbol: v })}
            placeholder="₵"
          />
          <SelectField
            label="Symbol position"
            value={s.currency.symbolPosition}
            onChange={(v) => u({ symbolPosition: v as "before" | "after" })}
            options={[
              { value: "before", label: "Before amount (₵100)" },
              { value: "after", label: "After amount (100₵)" },
            ]}
          />
          <TextField
            label="Decimal places"
            type="number"
            value={s.currency.decimalPlaces}
            onChange={(v) => u({ decimalPlaces: Number(v) })}
          />
        </>
      )}
    </SettingsPageShell>
  );
}
