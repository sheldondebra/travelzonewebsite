"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  KeyRound,
  Pencil,
  Plus,
  Search,
  ShieldOff,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator";
import { getApiErrorMessage } from "@/lib/auth-errors";
import {
  adminResetUserPassword,
  adminUnverifyUser,
  adminVerifyUser,
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
  type AdminUser,
  type CreateAdminUserPayload,
} from "@/services/admin-users";
import type { UserRole } from "@/types";

type ModalMode = "create" | "edit" | "reset" | null;

const emptyCreateForm: CreateAdminUserPayload = {
  name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
  role: "student",
  verified: true,
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ActionIcon({
  label,
  onClick,
  tone = "default",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "text-[#16A34A] hover:bg-[#F0FDF4]"
      : tone === "warning"
        ? "text-[#D97706] hover:bg-[#FFFBEB]"
        : tone === "danger"
          ? "text-[#DC2626] hover:bg-[#FEF2F2]"
          : "text-[#0057FF] hover:bg-[#EBF2FF]";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`rounded-lg p-2 transition-colors ${toneClass}`}
    >
      {children}
    </button>
  );
}

export function AdminUsersView() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [modal, setModal] = useState<ModalMode>(null);
  const [activeUser, setActiveUser] = useState<AdminUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "student" as UserRole });
  const [resetPassword, setResetPassword] = useState({ password: "", password_confirmation: "" });

  const stats = useMemo(
    () => ({
      total: users.length,
      verified: users.filter((u) => u.email_verified_at).length,
      admins: users.filter((u) => u.role === "admin").length,
    }),
    [users],
  );

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminUsers({
      search: search || undefined,
      status: filter === "all" ? undefined : filter,
      role: roleFilter === "all" ? undefined : roleFilter,
    })
      .then(setUsers)
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load users."));
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, [filter, roleFilter, search]);

  useEffect(() => {
    load();
  }, [filter, roleFilter]);

  function openCreate() {
    setCreateForm(emptyCreateForm);
    setModal("create");
  }

  function openEdit(user: AdminUser) {
    setActiveUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      role: user.role,
    });
    setModal("edit");
  }

  function openReset(user: AdminUser) {
    setActiveUser(user);
    setResetPassword({ password: "", password_confirmation: "" });
    setModal("reset");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createAdminUser(createForm);
      toast.success(res.message);
      setModal(null);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create user."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeUser) return;
    setSubmitting(true);
    try {
      const res = await updateAdminUser(activeUser.id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || null,
        role: editForm.role,
      });
      toast.success(res.message);
      setModal(null);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update user."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!activeUser) return;
    setSubmitting(true);
    try {
      const res = await adminResetUserPassword(activeUser.id, resetPassword);
      toast.success(res.message);
      setModal(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to reset password."));
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyUser(user: AdminUser) {
    try {
      const res = await adminVerifyUser(user.id);
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to verify user."));
    }
  }

  async function unverifyUser(user: AdminUser) {
    try {
      const res = await adminUnverifyUser(user.id);
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to remove verification."));
    }
  }

  async function removeUser(user: AdminUser) {
    if (!window.confirm(`Delete ${user.name} (${user.email})? This cannot be undone.`)) return;
    try {
      const res = await deleteAdminUser(user.id);
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete user."));
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">Users</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Manage accounts, verify emails, reset passwords, and update roles.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="ed-btn-primary gap-2 text-[13px]">
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total users", value: stats.total },
          { label: "Verified", value: stats.verified },
          { label: "Administrators", value: stats.admins },
        ].map((item) => (
          <div key={item.label} className="ed-card p-4">
            <p className="text-[22px] font-bold text-[#002B7F]">{item.value}</p>
            <p className="text-[12px] text-[#6B7280]">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            className="ed-input w-full pl-9"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <select
          className="ed-input w-auto min-w-[140px]"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">All statuses</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
        <select
          className="ed-input w-auto min-w-[130px]"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
        >
          <option value="all">All roles</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </select>
        <button type="button" onClick={load} className="ed-btn-outline text-[13px]">
          Search
        </button>
      </div>

      {loading ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">No users found.</div>
      ) : (
        <div className="ed-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-[13px]">
              <thead>
                <tr className="border-b border-[#E5EAF2] bg-[#F7F9FC] text-left text-[#6B7280]">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Enrollments</th>
                  <th className="px-3 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const verified = Boolean(user.email_verified_at);
                  return (
                    <tr key={user.id} className="border-b border-[#E5EAF2] last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#002B7F]">{user.name}</p>
                        <p className="text-[12px] text-[#6B7280]">{user.email}</p>
                        {user.phone && <p className="text-[11px] text-[#9CA3AF]">{user.phone}</p>}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${
                            user.role === "admin"
                              ? "bg-[#EBF2FF] text-[#0057FF]"
                              : "bg-[#F3F4F6] text-[#374151]"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {verified ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-medium text-[#166534]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-medium text-[#92400E]">
                            <XCircle className="h-3.5 w-3.5" />
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-[#374151]">{user.enrollments_count ?? 0}</td>
                      <td className="px-3 py-3 text-[#6B7280]">{formatDate(user.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-0.5">
                          <ActionIcon label="Edit user" onClick={() => openEdit(user)}>
                            <Pencil className="h-4 w-4" strokeWidth={1.75} />
                          </ActionIcon>
                          <ActionIcon label="Reset password" onClick={() => openReset(user)}>
                            <KeyRound className="h-4 w-4" strokeWidth={1.75} />
                          </ActionIcon>
                          {verified ? (
                            user.role !== "admin" && (
                              <ActionIcon
                                label="Remove verification"
                                tone="warning"
                                onClick={() => void unverifyUser(user)}
                              >
                                <ShieldOff className="h-4 w-4" strokeWidth={1.75} />
                              </ActionIcon>
                            )
                          ) : (
                            <ActionIcon
                              label="Verify user"
                              tone="success"
                              onClick={() => void verifyUser(user)}
                            >
                              <UserCheck className="h-4 w-4" strokeWidth={1.75} />
                            </ActionIcon>
                          )}
                          <ActionIcon
                            label="Delete user"
                            tone="danger"
                            onClick={() => void removeUser(user)}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                          </ActionIcon>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[12px] bg-white p-6 shadow-xl">
            {modal === "create" && (
              <form onSubmit={handleCreate} className="space-y-4">
                <h2 className="text-[18px] font-bold text-[#002B7F]">Add User</h2>
                {(["name", "email", "phone"] as const).map((field) => (
                  <div key={field}>
                    <label className="mb-1.5 block text-[13px] font-semibold capitalize text-[#002B7F]">
                      {field === "phone" ? "Phone (optional)" : field}
                    </label>
                    <input
                      className="ed-input w-full"
                      type={field === "email" ? "email" : "text"}
                      value={createForm[field]}
                      onChange={(e) => setCreateForm((f) => ({ ...f, [field]: e.target.value }))}
                      required={field !== "phone"}
                    />
                  </div>
                ))}
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#002B7F]">Role</label>
                  <select
                    className="ed-input w-full"
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, role: e.target.value as UserRole }))
                    }
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#002B7F]">Password</label>
                  <input
                    className="ed-input w-full"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#002B7F]">
                    Confirm password
                  </label>
                  <input
                    className="ed-input w-full"
                    type="password"
                    value={createForm.password_confirmation}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, password_confirmation: e.target.value }))
                    }
                    required
                  />
                </div>
                <PasswordStrengthIndicator password={createForm.password} />
                <label className="flex items-center gap-2 text-[13px] text-[#374151]">
                  <input
                    type="checkbox"
                    checked={createForm.verified}
                    onChange={(e) => setCreateForm((f) => ({ ...f, verified: e.target.checked }))}
                  />
                  Mark email as verified
                </label>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setModal(null)} className="ed-btn-outline flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="ed-btn-primary flex-1">
                    {submitting ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            )}

            {modal === "edit" && activeUser && (
              <form onSubmit={handleEdit} className="space-y-4">
                <h2 className="text-[18px] font-bold text-[#002B7F]">Edit User</h2>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#002B7F]">Name</label>
                  <input
                    className="ed-input w-full"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#002B7F]">Email</label>
                  <input
                    className="ed-input w-full"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#002B7F]">Phone</label>
                  <input
                    className="ed-input w-full"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#002B7F]">Role</label>
                  <select
                    className="ed-input w-full"
                    value={editForm.role}
                    onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setModal(null)} className="ed-btn-outline flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="ed-btn-primary flex-1">
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {modal === "reset" && activeUser && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <h2 className="text-[18px] font-bold text-[#002B7F]">Reset Password</h2>
                <p className="text-[13px] text-[#6B7280]">
                  Set a new password for <strong>{activeUser.email}</strong>.
                </p>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#002B7F]">
                    New password
                  </label>
                  <input
                    className="ed-input w-full"
                    type="password"
                    value={resetPassword.password}
                    onChange={(e) => setResetPassword((f) => ({ ...f, password: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#002B7F]">
                    Confirm password
                  </label>
                  <input
                    className="ed-input w-full"
                    type="password"
                    value={resetPassword.password_confirmation}
                    onChange={(e) =>
                      setResetPassword((f) => ({ ...f, password_confirmation: e.target.value }))
                    }
                    required
                  />
                </div>
                <PasswordStrengthIndicator password={resetPassword.password} />
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setModal(null)} className="ed-btn-outline flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="ed-btn-primary flex-1">
                    {submitting ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
