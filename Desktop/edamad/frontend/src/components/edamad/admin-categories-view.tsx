"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Eye,
  EyeOff,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/auth-errors";
import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  toggleAdminCategoryActive,
  updateAdminCategory,
  type AdminCategory,
  type AdminCategoryPayload,
} from "@/services/admin-categories";

const emptyForm: AdminCategoryPayload = {
  name: "",
  description: "",
  is_active: true,
  sort_order: 0,
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
  href,
  tone = "default",
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
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

  const className = `rounded-lg p-2 transition-colors ${toneClass}`;

  if (href) {
    return (
      <Link href={href} title={label} aria-label={label} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function AdminCategoriesView() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<AdminCategoryPayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const stats = useMemo(
    () => ({
      total: categories.length,
      active: categories.filter((c) => c.is_active).length,
      inactive: categories.filter((c) => !c.is_active).length,
      courses: categories.reduce((sum, c) => sum + c.courses_count, 0),
    }),
    [categories],
  );

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminCategories({
      search: search || undefined,
      status: statusFilter,
    })
      .then(setCategories)
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load categories."));
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      sort_order: categories.length + 1,
    });
    setModalOpen(true);
  }

  function openEdit(category: AdminCategory) {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description ?? "",
      is_active: category.is_active,
      sort_order: category.sort_order,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        const res = await updateAdminCategory(editing.id, form);
        toast.success(res.message);
      } else {
        const res = await createAdminCategory(form);
        toast.success(res.message);
      }
      closeModal();
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, editing ? "Failed to update category." : "Failed to create category."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(category: AdminCategory) {
    try {
      const res = await toggleAdminCategoryActive(category.id);
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update category status."));
    }
  }

  async function handleDelete(category: AdminCategory) {
    if (category.courses_count > 0) {
      toast.error(
        `Cannot delete "${category.name}" — ${category.courses_count} course(s) use this category. Reassign them first.`,
      );
      return;
    }

    if (!window.confirm(`Delete category "${category.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await deleteAdminCategory(category.id);
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete category."));
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">Categories</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Organize courses into catalog categories for filtering and course creation.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="ed-btn-primary gap-2 text-[13px]">
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total categories", value: stats.total, icon: FolderOpen },
          { label: "Active", value: stats.active, icon: Eye },
          { label: "Inactive", value: stats.inactive, icon: EyeOff },
          { label: "Courses tagged", value: stats.courses, icon: BookOpen },
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

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            className="ed-input w-full pl-9"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <select
          className="ed-input w-auto min-w-[140px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="button" onClick={load} className="ed-btn-outline text-[13px]">
          Search
        </button>
      </div>

      {loading ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">
          No categories found.{" "}
          <button type="button" onClick={openCreate} className="font-medium text-[#0057FF] hover:underline">
            Add your first category
          </button>
        </div>
      ) : (
        <div className="ed-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-[13px]">
              <thead>
                <tr className="border-b border-[#E5EAF2] bg-[#F7F9FC] text-left text-[#6B7280]">
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Slug</th>
                  <th className="px-3 py-3 font-medium">Courses</th>
                  <th className="px-3 py-3 font-medium">Order</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-[#E5EAF2] last:border-0 hover:bg-[#F7F9FC]/60">
                    <td className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EBF2FF] text-[#0057FF]">
                          <FolderOpen className="h-4 w-4" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#002B7F]">{category.name}</p>
                          {category.description ? (
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-[#9CA3AF]">{category.description}</p>
                          ) : (
                            <p className="mt-0.5 text-[11px] text-[#9CA3AF]">No description</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[#6B7280]">{category.slug}</td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/courses?category=${encodeURIComponent(category.name)}`}
                        className="font-semibold text-[#0057FF] hover:underline"
                      >
                        {category.courses_count}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-[#374151]">{category.sort_order}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                          category.is_active
                            ? "bg-[#DCFCE7] text-[#166534]"
                            : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[#9CA3AF]">{formatDate(category.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <ActionIcon label="Edit category" onClick={() => openEdit(category)}>
                          <Pencil className="h-4 w-4" />
                        </ActionIcon>
                        <ActionIcon
                          label={category.is_active ? "Deactivate category" : "Activate category"}
                          onClick={() => void handleToggle(category)}
                          tone={category.is_active ? "warning" : "success"}
                        >
                          {category.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </ActionIcon>
                        <ActionIcon
                          label="View courses"
                          href={`/admin/courses?category=${encodeURIComponent(category.name)}`}
                        >
                          <BookOpen className="h-4 w-4" />
                        </ActionIcon>
                        <ActionIcon
                          label="Delete category"
                          onClick={() => void handleDelete(category)}
                          tone="danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </ActionIcon>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[12px] bg-white shadow-xl">
            <div className="border-b border-[#E5EAF2] px-5 py-4">
              <h2 className="text-[17px] font-bold text-[#002B7F]">
                {editing ? "Edit Category" : "Add Category"}
              </h2>
              <p className="mt-0.5 text-[12px] text-[#6B7280]">
                {editing ? "Renaming updates all courses using this category." : "Create a new course category."}
              </p>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">
                  Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  className="ed-input w-full"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Pharmacology"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Description</label>
                <textarea
                  className="ed-input min-h-[88px] w-full resize-y py-2"
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description for admins"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Sort order</label>
                  <input
                    type="number"
                    min={0}
                    className="ed-input w-full"
                    value={form.sort_order ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  />
                </div>
                <label className="flex items-end gap-2 rounded-[10px] border border-[#E5EAF2] px-3 py-2.5 sm:mb-0">
                  <input
                    type="checkbox"
                    checked={form.is_active ?? true}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-[#D1D5DB] text-[#0057FF]"
                  />
                  <span className="text-[13px] text-[#374151]">Active in catalog</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#E5EAF2] px-5 py-4">
              <button type="button" onClick={closeModal} className="ed-btn-outline text-[13px]" disabled={submitting}>
                Cancel
              </button>
              <button type="button" onClick={() => void handleSubmit()} className="ed-btn-primary text-[13px]" disabled={submitting}>
                {submitting ? "Saving..." : editing ? "Save changes" : "Create category"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
