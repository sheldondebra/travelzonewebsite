"use client";

import { SettingsPageShell } from "@/components/settings/settings-shell";
import { SelectField, TextField, Toggle } from "@/components/settings/fields";

export default function PosReceiptSettingsPage() {
  return (
    <SettingsPageShell
      title="POS receipt"
      description="Receipt layout, branding, and automatic customer delivery after each sale"
      section="posReceipt"
    >
      {(s, u) => (
        <>
          <p className="text-sm font-medium text-muted-foreground">Layout</p>
          <Toggle
            label="Show logo on receipt"
            checked={s.posReceipt.showLogo}
            onChange={(v) => u({ showLogo: v })}
          />
          <Toggle
            label="Show tax & discount breakdown"
            checked={s.posReceipt.showTaxBreakdown}
            onChange={(v) => u({ showTaxBreakdown: v })}
          />
          <Toggle
            label="Show SKU / product codes"
            checked={s.posReceipt.showItemCodes}
            onChange={(v) => u({ showItemCodes: v })}
          />
          <Toggle
            label="Show business phone on receipt"
            checked={s.posReceipt.showBusinessPhone}
            onChange={(v) => u({ showBusinessPhone: v })}
          />
          <Toggle
            label="Show business address"
            checked={s.posReceipt.showBusinessAddress}
            onChange={(v) => u({ showBusinessAddress: v })}
          />
          <SelectField
            label="Paper size"
            value={s.posReceipt.paperSize}
            onChange={(v) => u({ paperSize: v as "58mm" | "80mm" })}
            options={[
              { value: "58mm", label: "58mm thermal" },
              { value: "80mm", label: "80mm thermal" },
            ]}
          />
          <TextField
            label="Header text (optional — defaults to business name)"
            value={s.posReceipt.headerText}
            onChange={(v) => u({ headerText: v })}
          />
          <TextField
            label="Business phone"
            value={s.posReceipt.businessPhone}
            onChange={(v) => u({ businessPhone: v })}
          />
          <TextField
            label="Business address"
            value={s.posReceipt.businessAddress}
            onChange={(v) => u({ businessAddress: v })}
          />
          <TextField
            label="Thank you message"
            value={s.posReceipt.thankYouMessage}
            onChange={(v) => u({ thankYouMessage: v })}
          />

          <p className="border-t pt-4 text-sm font-medium text-muted-foreground">
            Instant delivery after POS sale
          </p>
          <Toggle
            label="Send SMS receipt to customer"
            checked={s.posReceipt.sendSmsOnSale}
            onChange={(v) => u({ sendSmsOnSale: v })}
            description="Requires SMS credits and receipt automation enabled under Settings → SMS"
          />
          <Toggle
            label="Send email receipt to customer"
            checked={s.posReceipt.sendEmailOnSale}
            onChange={(v) => u({ sendEmailOnSale: v })}
            description="Requires Mail enabled under Settings → Mail"
          />
        </>
      )}
    </SettingsPageShell>
  );
}
