"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/auth-errors";
import {
  createAdminRole,
  deleteAdminRole,
  fetchAdminPermissions,
  fetchAdminRoles,
  updateAdminRole,
  type AdminPermission,
  type AdminRole,
} from "@/services/admin-roles";

type Tab = "roles" | "permissions";

function slugifyRoleName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function AdminRolesView() {
  const [tab, setTab] = useState<Tab>("roles");
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, AdminPermission[]>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRole | null>(null);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const stats = useMemo(
    () => ({
      roles: roles.length,
      permissions: Object.values(groupedPermissions).flat().length,
      system: roles.filter((r) => r.is_system).length,
      custom: roles.filter((r) => !r.is_system).length,
    }),
    [roles, groupedPermissions],
  );

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchAdminRoles(), fetchAdminPermissions()])
      .then(([rolesData, permissionsData]) => {
        setRoles(rolesData);
        setGroupedPermissions(permissionsData.grouped);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load roles and permissions."));
        setRoles([]);
        setGroupedPermissions({});
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setRoleName("");
    setSelectedPermissions([]);
    setModalOpen(true);
  }

  function openEdit(role: AdminRole) {
    setEditing(role);
    setRoleName(role.name);
    setSelectedPermissions(role.permissions);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setRoleName("");
    setSelectedPermissions([]);
  }

  function togglePermission(name: string) {
    setSelectedPermissions((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name],
    );
  }

  function toggleGroup(group: string, checked: boolean) {
    const names = (groupedPermissions[group] ?? []).map((p) => p.name);
    setSelectedPermissions((prev) => {
      if (checked) {
        return [...new Set([...prev, ...names])];
      }
      return prev.filter((p) => !names.includes(p));
    });
  }

  async function handleSubmit() {
    const name = editing?.is_system ? editing.name : slugifyRoleName(roleName);
    if (!name) {
      toast.error("Role slug is required (lowercase letters, numbers, hyphens).");
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        const res = await updateAdminRole(editing.id, {
          ...(editing.is_system ? {} : { name }),
          permissions: selectedPermissions,
        });
        toast.success(res.message);
      } else {
        const res = await createAdminRole({ name, permissions: selectedPermissions });
        toast.success(res.message);
      }
      closeModal();
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, editing ? "Failed to update role." : "Failed to create role."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(role: AdminRole) {
    if (role.is_system) {
      toast.error("System roles cannot be deleted.");
      return;
    }
    if (!window.confirm(`Delete role "${role.label}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await deleteAdminRole(role.id);
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete role."));
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">Roles & Permissions</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Control admin and staff access across the platform using Spatie permissions.
          </p>
        </div>
        {tab === "roles" ? (
          <button type="button" onClick={openCreate} className="ed-btn-primary gap-2 text-[13px]">
            <Plus className="h-4 w-4" />
            New Role
          </button>
        ) : null}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Roles", value: stats.roles, icon: Shield },
          { label: "Permissions", value: stats.permissions, icon: KeyRound },
          { label: "System roles", value: stats.system, icon: Lock },
          { label: "Custom roles", value: stats.custom, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="ed-card flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EBF2FF] text-[#0057FF]">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[22px] font-bold leading-none text-[#002B7F]">{value.toLocaleString()}</p>
              <p className="mt-1 text-[12px] text-[#6B7280]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        {(["roles", "permissions"] as Tab[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-[10px] px-4 py-2 text-[13px] font-medium transition-colors ${
              tab === id ? "bg-[#0057FF] text-white" : "bg-white text-[#374151] ring-1 ring-[#E5EAF2] hover:bg-[#F7F9FC]"
            }`}
          >
            {id === "roles" ? "Roles" : "Permissions"}
          </button>
        ))}
        <Link href="/admin/students" className="ml-auto ed-btn-outline text-[13px]">
          Manage Users
        </Link>
      </div>

      {loading ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">Loading...</div>
      ) : tab === "roles" ? (
        <div className="ed-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-[13px]">
              <thead>
                <tr className="border-b border-[#E5EAF2] bg-[#F7F9FC] text-left text-[#6B7280]">
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Slug</th>
                  <th className="px-3 py-3 font-medium">Permissions</th>
                  <th className="px-3 py-3 font-medium">Users</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="border-b border-[#E5EAF2] last:border-0 hover:bg-[#F7F9FC]/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EBF2FF] text-[#0057FF]">
                          <Shield className="h-4 w-4" />
                        </div>
                        <p className="font-medium text-[#002B7F]">{role.label}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px] text-[#6B7280]">{role.name}</td>
                    <td className="px-3 py-3 text-[#374151]">{role.permissions_count}</td>
                    <td className="px-3 py-3">
                      <Link href={`/admin/students?role=${role.name}`} className="font-semibold text-[#0057FF] hover:underline">
                        {role.users_count}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                          role.is_system ? "bg-[#EBF2FF] text-[#0057FF]" : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}
                      >
                        {role.is_system ? "System" : "Custom"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          title="Edit permissions"
                          onClick={() => openEdit(role)}
                          className="rounded-lg p-2 text-[#0057FF] transition-colors hover:bg-[#EBF2FF]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {!role.is_system ? (
                          <button
                            type="button"
                            title="Delete role"
                            onClick={() => void handleDelete(role)}
                            className="rounded-lg p-2 text-[#DC2626] transition-colors hover:bg-[#FEF2F2]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedPermissions).map(([group, permissions]) => (
            <div key={group} className="ed-card p-5">
              <h3 className="mb-3 text-[15px] font-semibold text-[#002B7F]">{group}</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {permissions.map((permission) => (
                  <li
                    key={permission.id}
                    className="flex items-start gap-2 rounded-[10px] border border-[#E5EAF2] px-3 py-2.5"
                  >
                    <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#0057FF]" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#374151]">{permission.label}</p>
                      <p className="font-mono text-[11px] text-[#9CA3AF]">{permission.name}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[12px] bg-white shadow-xl">
            <div className="border-b border-[#E5EAF2] px-5 py-4">
              <h2 className="text-[17px] font-bold text-[#002B7F]">
                {editing ? `Edit ${editing.label}` : "Create Role"}
              </h2>
              <p className="mt-0.5 text-[12px] text-[#6B7280]">
                Assign permissions to control what this role can access.
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              {!editing?.is_system ? (
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Role slug</label>
                  <input
                    className="ed-input w-full font-mono text-[13px]"
                    value={roleName}
                    onChange={(e) => setRoleName(slugifyRoleName(e.target.value))}
                    placeholder="e.g. content-manager"
                  />
                  <p className="mt-1 text-[11px] text-[#9CA3AF]">Lowercase letters, numbers, and hyphens only.</p>
                </div>
              ) : (
                <p className="rounded-[10px] bg-[#F7F9FC] px-3 py-2 text-[12px] text-[#6B7280]">
                  System role <span className="font-mono font-medium text-[#002B7F]">{editing.name}</span> — you can
                  update permissions but not rename or delete it.
                </p>
              )}

              <div>
                <p className="mb-3 text-[12px] font-semibold text-[#002B7F]">
                  Permissions ({selectedPermissions.length} selected)
                </p>
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([group, permissions]) => {
                    const groupNames = permissions.map((p) => p.name);
                    const allSelected = groupNames.every((n) => selectedPermissions.includes(n));
                    const someSelected = groupNames.some((n) => selectedPermissions.includes(n));

                    return (
                      <div key={group} className="rounded-[10px] border border-[#E5EAF2] p-3">
                        <label className="mb-2 flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected && !allSelected;
                            }}
                            onChange={(e) => toggleGroup(group, e.target.checked)}
                            className="h-4 w-4 rounded border-[#D1D5DB] text-[#0057FF]"
                          />
                          <span className="text-[13px] font-semibold text-[#002B7F]">{group}</span>
                        </label>
                        <ul className="grid gap-1.5 sm:grid-cols-2">
                          {permissions.map((permission) => {
                            const checked = selectedPermissions.includes(permission.name);
                            return (
                              <li key={permission.id}>
                                <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F7F9FC]">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => togglePermission(permission.name)}
                                    className="mt-0.5 h-4 w-4 rounded border-[#D1D5DB] text-[#0057FF]"
                                  />
                                  <span className="min-w-0">
                                    <span className="block text-[12px] text-[#374151]">{permission.label}</span>
                                    <span className="font-mono text-[10px] text-[#9CA3AF]">{permission.name}</span>
                                  </span>
                                  {checked ? <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-[#16A34A]" /> : null}
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E5EAF2] px-5 py-4">
              <button type="button" onClick={closeModal} className="ed-btn-outline text-[13px]" disabled={submitting}>
                Cancel
              </button>
              <button type="button" onClick={() => void handleSubmit()} className="ed-btn-primary text-[13px]" disabled={submitting}>
                {submitting ? "Saving..." : editing ? "Save role" : "Create role"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
