"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { SettingsPageShell } from "@/components/settings/settings-shell";
import { SelectField, Toggle } from "@/components/settings/fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseApiResponse } from "@/lib/api-client";
import { capitalizeLabel } from "@/lib/format-label";

type StaffRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  hasPin: boolean;
};

function CashierPinSection() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;
  const [myPin, setMyPin] = useState("");
  const [staffPins, setStaffPins] = useState<Record<string, string>>({});

  const { data: staff = [] } = useQuery({
    queryKey: ["pos-staff"],
    queryFn: async () => {
      const res = await fetch("/api/pos/cashier/staff");
      return parseApiResponse<StaffRow[]>(res);
    },
  });

  const setPinMutation = useMutation({
    mutationFn: async ({
      targetUserId,
      pin,
    }: {
      targetUserId: string;
      pin: string | null;
    }) => {
      const res = await fetch("/api/pos/cashier/set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId, pin }),
      });
      return parseApiResponse(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-staff"] });
      toast.success("PIN updated");
      setMyPin("");
      setStaffPins({});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isManager =
    session?.user?.role === "OWNER" ||
    session?.user?.role === "MANAGER" ||
    session?.user?.role === "PLATFORM_ADMIN";

  return (
    <div className="space-y-6 border-t border-gray-100 pt-6">
      <div>
        <h3 className="text-sm font-semibold">{capitalizeLabel("Cashier PIN")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Staff use a 4–6 digit PIN at POS to identify who handled each sale.
        </p>
      </div>

      {userId && (
        <div className="rounded-xl border border-gray-100 bg-brand-cream/30 p-4">
          <Label htmlFor="my-pos-pin">{capitalizeLabel("Your PIN")}</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            <Input
              id="my-pos-pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="4–6 digits"
              className="max-w-[140px] rounded-xl"
              value={myPin}
              onChange={(e) =>
                setMyPin(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
            <Button
              className="rounded-xl"
              disabled={myPin.length < 4 || setPinMutation.isPending}
              onClick={() =>
                setPinMutation.mutate({ targetUserId: userId, pin: myPin })
              }
            >
              {capitalizeLabel("Save PIN")}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={setPinMutation.isPending}
              onClick={() =>
                setPinMutation.mutate({ targetUserId: userId, pin: null })
              }
            >
              {capitalizeLabel("Clear")}
            </Button>
          </div>
        </div>
      )}

      {isManager && staff.length > 1 && (
        <ul className="space-y-3">
          {staff
            .filter((s) => s.id !== userId)
            .map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-gray-100 p-3"
              >
                <div>
                  <p className="font-medium">{member.name ?? member.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.role.replace(/_/g, " ")}
                    {member.hasPin ? " · PIN set" : " · No PIN"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="PIN"
                    className="w-24 rounded-xl"
                    value={staffPins[member.id] ?? ""}
                    onChange={(e) =>
                      setStaffPins((prev) => ({
                        ...prev,
                        [member.id]: e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6),
                      }))
                    }
                  />
                  <Button
                    size="sm"
                    className="rounded-xl"
                    disabled={
                      (staffPins[member.id]?.length ?? 0) < 4 ||
                      setPinMutation.isPending
                    }
                    onClick={() =>
                      setPinMutation.mutate({
                        targetUserId: member.id,
                        pin: staffPins[member.id] ?? "",
                      })
                    }
                  >
                    Set
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default function PosSettingsPage() {
  return (
    <SettingsPageShell
      title="POS settings"
      description="Point-of-sale checkout behavior"
      section="pos"
    >
      {(s, u) => (
        <>
          <Toggle
            label="Sound on scan"
            checked={s.pos.soundOnScan}
            onChange={(v) => u({ soundOnScan: v })}
          />
          <Toggle
            label="Allow price edit at POS"
            checked={s.pos.allowPriceEdit}
            onChange={(v) => u({ allowPriceEdit: v })}
          />
          <Toggle
            label="Auto-select last customer"
            checked={s.pos.autoSelectCustomer}
            onChange={(v) => u({ autoSelectCustomer: v })}
          />
          <Toggle
            label="Require cashier PIN before selling"
            checked={s.pos.requireCashierPin}
            onChange={(v) => u({ requireCashierPin: v })}
          />
          <Toggle
            label="Allow cashier switch at POS"
            checked={s.pos.allowCashierSwitch}
            onChange={(v) => u({ allowCashierSwitch: v })}
          />
          <SelectField
            label="Default payment method"
            value={s.pos.defaultPaymentMethod}
            onChange={(v) => u({ defaultPaymentMethod: v })}
            options={[
              { value: "CASH", label: "Cash" },
              { value: "MOMO", label: "Mobile Money" },
              { value: "BANK_TRANSFER", label: "Bank Transfer" },
              { value: "CARD", label: "Card" },
            ]}
          />
          <CashierPinSection />
        </>
      )}
    </SettingsPageShell>
  );
}
