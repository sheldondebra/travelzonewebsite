"use client";

import { useQuery } from "@tanstack/react-query";
import { SettingsPageShell } from "@/components/settings/settings-shell";
import { SelectField, TextField, Toggle } from "@/components/settings/fields";
import { Badge } from "@/components/ui/badge";
import { parseApiResponse } from "@/lib/api-client";

type PaymentStatus = {
  status: string;
  providers: string[];
};

export default function PaymentGatewayPage() {
  const { data: gatewayStatus } = useQuery({
    queryKey: ["payment-gateway-status"],
    queryFn: async () => {
      const res = await fetch("/api/payments");
      return parseApiResponse<PaymentStatus>(res);
    },
  });

  const configured = gatewayStatus?.status !== "not_configured";

  return (
    <SettingsPageShell
      title="Payment gateway"
      description="Online checkout payments (Paystack / Flutterwave)"
      section="paymentGateway"
    >
      {(s, u) => (
        <>
          <div className="rounded-xl border border-gray-100 bg-muted/20 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Gateway status</span>
              <Badge variant={configured ? "default" : "secondary"}>
                {configured ? "Ready for integration" : "Not configured"}
              </Badge>
            </div>
            <p className="mt-2 text-muted-foreground">
              Online payment processing is in Phase 2. Save keys here for when checkout goes live,
              or set <code className="rounded bg-muted px-1">PAYSTACK_SECRET_KEY</code> in .env.
            </p>
          </div>

          <SelectField
            label="Provider"
            value={s.paymentGateway.provider}
            onChange={(v) => u({ provider: v })}
            options={[
              { value: "paystack", label: "Paystack" },
              { value: "flutterwave", label: "Flutterwave" },
            ]}
          />
          <Toggle
            label="Test mode"
            checked={s.paymentGateway.testMode}
            onChange={(v) => u({ testMode: v })}
          />
          <TextField
            label="Public key"
            value={s.paymentGateway.publicKey}
            onChange={(v) => u({ publicKey: v })}
            placeholder="pk_test_…"
          />
          <TextField
            label="Secret key"
            value={s.paymentGateway.secretKey}
            onChange={(v) => u({ secretKey: v })}
            placeholder="sk_test_…"
          />
          <TextField
            label="Webhook secret"
            value={s.paymentGateway.webhookSecret}
            onChange={(v) => u({ webhookSecret: v })}
          />
        </>
      )}
    </SettingsPageShell>
  );
}
