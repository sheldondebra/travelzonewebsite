"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import {
  deleteStaffAction,
  updateStaffRoleAction,
  type UsersActionResult,
} from "@/app/admin/actions/users";
import { AdminNotice } from "@/components/admin/AdminChrome";
import type { StaffRole } from "@/lib/supabase/auth";
import { getStaffRoleLabel, STAFF_ROLE_OPTIONS, STAFF_ROLES } from "@/lib/staff-roles";

type StaffUser = {
  id: string;
  email: string;
  role: StaffRole;
  createdAt: string;
};

type RoleFilter = "all" | StaffRole;

type Props = {
  users: StaffUser[];
  currentUserId: string;
};

function ActionMessage({ result }: { result: UsersActionResult | undefined }) {
  if (!result) return null;
  return (
    <AdminNotice variant={result.success ? "success" : "error"}>
      {result.success ? result.message : result.error}
    </AdminNotice>
  );
}

export function UsersList({ users, currentUserId }: Props) {
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");

  const adminCount = users.filter((user) => user.role === "admin").length;
  const editorCount = users.filter((user) => user.role === "editor").length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      if (filter !== "all" && user.role !== filter) return false;
      if (!query) return true;
      return user.email.toLowerCase().includes(query);
    });
  }, [filter, search, users]);

  return (
    <>
      <div className="admin-users-toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search users"
          className="admin-input w-full sm:max-w-xs"
          aria-label="Search users"
        />
      </div>

      <ul className="admin-subsubsub">
        <li>
          <button
            type="button"
            className={filter === "all" ? "current" : ""}
            onClick={() => setFilter("all")}
          >
            All ({users.length})
          </button>
        </li>
        <li>
          <button
            type="button"
            className={filter === "admin" ? "current" : ""}
            onClick={() => setFilter("admin")}
          >
            Administrator ({adminCount})
          </button>
        </li>
        <li>
          <button
            type="button"
            className={filter === "editor" ? "current" : ""}
            onClick={() => setFilter("editor")}
          >
            Editor ({editorCount})
          </button>
        </li>
      </ul>

      <div className="admin-postbox overflow-hidden p-0">
        <div className="admin-table-scroll">
        <table className="admin-list-table">
          <thead>
            <tr>
              <th className="w-[36%]">Username</th>
              <th className="w-[18%]">Role</th>
              <th className="w-[18%]">Member since</th>
              <th className="w-[28%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-[#646970]">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  currentUserId={currentUserId}
                />
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}

function UserRow({
  user,
  currentUserId,
}: {
  user: StaffUser;
  currentUserId: string;
}) {
  const isSelf = user.id === currentUserId;
  const [updateState, updateAction, updatePending] = useActionState(
    updateStaffRoleAction,
    undefined,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteStaffAction,
    undefined,
  );
  const router = useRouter();

  useEffect(() => {
    if (updateState?.success || deleteState?.success) {
      router.refresh();
    }
  }, [deleteState, router, updateState]);

  return (
    <tr>
      <td>
        <strong className="text-[#1d2327]">{user.email}</strong>
        {isSelf ? (
          <span className="ml-2 text-[11px] font-semibold uppercase text-[#646970]">
            (you)
          </span>
        ) : null}
        {updateState ? <ActionMessage result={updateState} /> : null}
        {deleteState ? <ActionMessage result={deleteState} /> : null}
      </td>
      <td>
        <span className="admin-role-badge">{getStaffRoleLabel(user.role)}</span>
      </td>
      <td className="text-[#646970]">
        {new Date(user.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
      <td>
        <form action={updateAction} className="admin-user-inline-form">
          <input type="hidden" name="userId" value={user.id} />
          <select
            name="role"
            defaultValue={user.role}
            className="admin-input py-1"
            disabled={updatePending}
            aria-label={`Role for ${user.email}`}
          >
            {STAFF_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {getStaffRoleLabel(role)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={updatePending}
            className="admin-button-secondary"
          >
            {updatePending ? "Saving…" : "Update"}
          </button>
        </form>

        {!isSelf ? (
          <form
            action={deleteAction}
            className="mt-2"
            onSubmit={(event) => {
              if (
                !confirm(
                  `Delete ${user.email}? This removes their access and cannot be undone.`,
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              disabled={deletePending}
              className="admin-row-action-delete"
            >
              {deletePending ? "Deleting…" : "Delete"}
            </button>
          </form>
        ) : null}
      </td>
    </tr>
  );
}

export function RoleCapabilities({ role }: { role: StaffRole }) {
  const config = STAFF_ROLES[role];

  return (
    <div className="admin-role-capabilities">
      <p className="m-0 text-[13px] font-semibold text-[#1d2327]">
        {config.label}
      </p>
      <p className="mt-1 mb-2 text-[13px] text-[#646970]">{config.description}</p>
      <ul className="m-0 list-disc space-y-1 pl-5 text-[13px] text-[#646970]">
        {config.capabilities.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
