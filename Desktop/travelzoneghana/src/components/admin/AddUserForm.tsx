"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createStaffAction, type UsersActionResult } from "@/app/admin/actions/users";
import { AdminNotice, AdminWidget } from "@/components/admin/AdminChrome";
import { RoleCapabilities } from "@/components/admin/UsersList";
import type { StaffRole } from "@/lib/supabase/auth";
import { getStaffRoleLabel, STAFF_ROLE_OPTIONS } from "@/lib/staff-roles";

type Props = {
  defaultEmail?: string;
};

function FormMessage({ result }: { result: UsersActionResult | undefined }) {
  if (!result) return null;
  return (
    <AdminNotice variant={result.success ? "success" : "error"}>
      {result.success ? result.message : result.error}
    </AdminNotice>
  );
}

export function AddUserForm({ defaultEmail = "" }: Props) {
  const [role, setRole] = useState<StaffRole>("editor");
  const [sendInvite, setSendInvite] = useState(false);
  const [state, formAction, pending] = useActionState(createStaffAction, undefined);

  return (
    <div className="admin-users-add-layout">
      <form action={formAction} className="admin-postbox">
        <div className="admin-postbox-header">
          <h2>Add New User</h2>
        </div>
        <div className="admin-postbox-body space-y-4">
          <FormMessage result={state} />

          <div>
            <label htmlFor="email" className="admin-label">
              Email <span className="text-[#d63638]">(required)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={defaultEmail}
              autoComplete="off"
              className="admin-input max-w-md"
            />
            <p className="mt-1 text-[12px] text-[#646970]">
              This address is used to sign in to the admin area.
            </p>
          </div>

          <div>
            <label htmlFor="role" className="admin-label">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value as StaffRole)}
              className="admin-input max-w-md"
            >
              {STAFF_ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {getStaffRoleLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="sendInvite"
              checked={sendInvite}
              onChange={(event) => setSendInvite(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#2271b1]"
            />
            <span>
              <span className="block text-[13px] font-semibold text-[#1d2327]">
                Send invitation email
              </span>
              <span className="mt-0.5 block text-[13px] text-[#646970]">
                Email the user a link to set their password instead of creating one
                here.
              </span>
            </span>
          </label>

          {!sendInvite ? (
            <div>
              <label htmlFor="password" className="admin-label">
                Password <span className="text-[#d63638]">(required)</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                className="admin-input max-w-md"
              />
              <p className="mt-1 text-[12px] text-[#646970]">
                Minimum 8 characters. Share this password with the user securely.
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" disabled={pending} className="admin-button-primary">
              {pending ? "Adding…" : sendInvite ? "Send invitation" : "Add New User"}
            </button>
            <Link href="/admin/users" className="admin-button-secondary">
              Cancel
            </Link>
          </div>
        </div>
      </form>

      <AdminWidget title="Role capabilities">
        <RoleCapabilities role={role} />
      </AdminWidget>
    </div>
  );
}
