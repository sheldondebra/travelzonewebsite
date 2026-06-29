"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createStaffAction } from "@/app/admin/actions/users";
import { useAdminActionFeedback } from "@/components/admin/AdminToastProvider";
import { AdminWidget } from "@/components/admin/AdminChrome";
import { RoleCapabilities } from "@/components/admin/UsersList";
import type { StaffRole } from "@/lib/supabase/auth";
import { getStaffRoleLabel, STAFF_ROLE_OPTIONS } from "@/lib/staff-roles";

type Props = {
  defaultEmail?: string;
  variant?: "full" | "compact";
  showCancel?: boolean;
};

export function StaffUserForm({
  defaultEmail = "",
  variant = "full",
  showCancel = true,
}: Props) {
  const [role, setRole] = useState<StaffRole>("editor");
  const [sendInvite, setSendInvite] = useState(variant === "compact");
  const [state, formAction, pending] = useActionState(createStaffAction, undefined);

  useAdminActionFeedback(state, pending, {
    loadingMessage: sendInvite ? "Sending invitation…" : "Adding user…",
  });

  const submitLabel = pending
    ? "Adding…"
    : sendInvite
      ? "Send invitation"
      : "Add user";

  const formFields = (
    <>
      <div className={variant === "compact" ? "admin-form-grid-2" : "space-y-4"}>
        <div className={variant === "compact" ? "sm:col-span-2" : undefined}>
          <label htmlFor="staff-email" className="admin-label">
            Email <span className="text-[#d63638]">(required)</span>
          </label>
          <input
            id="staff-email"
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            autoComplete="off"
            placeholder="name@company.com"
            className={`admin-input ${variant === "full" ? "max-w-md" : ""}`}
          />
          {variant === "full" ? (
            <p className="admin-field-hint">Used to sign in to the admin dashboard.</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="staff-role" className="admin-label">
            Role
          </label>
          <select
            id="staff-role"
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value as StaffRole)}
            className={`admin-input ${variant === "full" ? "max-w-md" : ""}`}
          >
            {STAFF_ROLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {getStaffRoleLabel(option)}
              </option>
            ))}
          </select>
        </div>

        <div className={variant === "compact" ? "sm:col-span-2" : undefined}>
          <label className="admin-settings-toggle">
            <input
              type="checkbox"
              name="sendInvite"
              checked={sendInvite}
              onChange={(event) => setSendInvite(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#2271b1]"
            />
            <span>
              <span className="block text-[13px] font-semibold text-[#1d2327]">
                Send invitation email
              </span>
              <span className="admin-field-hint mt-0.5 block">
                Email a link to set their password instead of creating one here.
              </span>
            </span>
          </label>
        </div>

        {!sendInvite ? (
          <div className={variant === "compact" ? "sm:col-span-2" : undefined}>
            <label htmlFor="staff-password" className="admin-label">
              Password <span className="text-[#d63638]">(required)</span>
            </label>
            <input
              id="staff-password"
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              className={`admin-input ${variant === "full" ? "max-w-md" : ""}`}
            />
            {variant === "full" ? (
              <p className="admin-field-hint">
                Minimum 8 characters. Share this password with the user securely.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={`flex flex-wrap gap-2 ${variant === "full" ? "pt-1" : "pt-2"}`}>
        <button
          type="submit"
          disabled={pending}
          className={variant === "compact" ? "admin-login-submit sm:w-auto" : "admin-button-primary"}
        >
          {submitLabel}
        </button>
        {showCancel ? (
          <Link href="/admin/users" className="admin-button-secondary">
            Cancel
          </Link>
        ) : null}
      </div>
    </>
  );

  if (variant === "compact") {
    return <form action={formAction}>{formFields}</form>;
  }

  return (
    <div className="admin-users-add-layout">
      <form action={formAction} className="admin-postbox">
        <div className="admin-postbox-header">
          <h2>Add dashboard user</h2>
        </div>
        <div className="admin-postbox-body space-y-4">{formFields}</div>
      </form>

      <AdminWidget title="Role capabilities">
        <RoleCapabilities role={role} />
      </AdminWidget>
    </div>
  );
}
