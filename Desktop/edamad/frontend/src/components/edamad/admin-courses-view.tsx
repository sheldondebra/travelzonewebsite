"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/auth-errors";
import { COURSE_CATEGORIES, DIFFICULTY_LEVELS, INSTRUCTORS } from "@/lib/create-course-data";
import { formatGhs, getStoreCourseIcon } from "@/lib/store-utils";
import { fetchAdminCategories } from "@/services/admin-categories";
import {
  deleteAdminCourse,
  fetchAdminCourses,
  toggleAdminCoursePublish,
  updateAdminCourse,
  type AdminCourse,
  type UpdateAdminCoursePayload,
} from "@/services/admin-courses";

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

const emptyEditForm: UpdateAdminCoursePayload = {
  title: "",
  course_code: "",
  category: "",
  instructor: "",
  difficulty: "",
  short_description: "",
  price: "",
  is_active: true,
};

export function AdminCoursesView() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "all";
  const initialSearch = searchParams.get("search") ?? "";

  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([...COURSE_CATEGORIES]);
  const [editOpen, setEditOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState<AdminCourse | null>(null);
  const [editForm, setEditForm] = useState<UpdateAdminCoursePayload>(emptyEditForm);
  const [submitting, setSubmitting] = useState(false);

  const stats = useMemo(
    () => ({
      total: courses.length,
      published: courses.filter((c) => c.is_published).length,
      drafts: courses.filter((c) => !c.is_published).length,
      enrollments: courses.reduce((sum, c) => sum + (c.enrollments_count ?? 0), 0),
    }),
    [courses],
  );

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminCourses({
      search: search || undefined,
      status: statusFilter,
      category: categoryFilter === "all" ? undefined : categoryFilter,
    })
      .then(setCourses)
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load courses."));
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, [categoryFilter, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchAdminCategories()
      .then((items) => {
        if (items.length > 0) {
          setCategoryOptions(items.map((item) => item.name));
        }
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  function openEdit(course: AdminCourse) {
    setActiveCourse(course);
    setEditForm({
      title: course.title,
      course_code: course.course_code ?? "",
      category: course.category ?? "",
      instructor: course.instructor ?? "",
      difficulty: course.difficulty ?? "",
      short_description: course.short_description ?? "",
      price: course.price,
      is_active: course.is_active,
    });
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setActiveCourse(null);
    setEditForm(emptyEditForm);
  }

  async function handleSaveEdit() {
    if (!activeCourse || !editForm.title?.trim()) {
      toast.error("Course title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateAdminCourse(activeCourse.id, {
        ...editForm,
        price: editForm.price === "" ? 0 : Number(editForm.price),
      });
      toast.success(res.message);
      closeEdit();
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update course."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTogglePublish(course: AdminCourse) {
    try {
      const res = await toggleAdminCoursePublish(course.id);
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update publish status."));
    }
  }

  async function handleDelete(course: AdminCourse) {
    if (
      !window.confirm(
        `Delete "${course.title}"? This will also remove ${course.lessons_count ?? 0} lesson(s) and ${course.enrollments_count ?? 0} enrollment(s). This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const res = await deleteAdminCourse(course.id);
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete course."));
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">Courses</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Manage course catalog, pricing, publish status, and lesson content.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/courses/upload" className="ed-btn-outline gap-2 text-[13px]">
            <Upload className="h-4 w-4" />
            Video Upload
          </Link>
          <Link href="/admin/courses/create" className="ed-btn-primary gap-2 text-[13px]">
            <Plus className="h-4 w-4" />
            Create Course
          </Link>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total courses", value: stats.total },
          { label: "Published", value: stats.published },
          { label: "Drafts", value: stats.drafts },
          { label: "Total enrollments", value: stats.enrollments },
        ].map((item) => (
          <div key={item.label} className="ed-card p-4">
            <p className="text-[22px] font-bold text-[#002B7F]">{item.value.toLocaleString()}</p>
            <p className="text-[12px] text-[#6B7280]">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            className="ed-input w-full pl-9"
            placeholder="Search by title, code, category, or instructor..."
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
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          className="ed-input w-auto min-w-[160px]"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <button type="button" onClick={load} className="ed-btn-outline text-[13px]">
          Search
        </button>
      </div>

      {loading ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">
          No courses found.{" "}
          <Link href="/admin/courses/create" className="font-medium text-[#0057FF] hover:underline">
            Create your first course
          </Link>
        </div>
      ) : (
        <div className="ed-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-[13px]">
              <thead>
                <tr className="border-b border-[#E5EAF2] bg-[#F7F9FC] text-left text-[#6B7280]">
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-3 py-3 font-medium">Code</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Lessons</th>
                  <th className="px-3 py-3 font-medium">Enrollments</th>
                  <th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const Icon = getStoreCourseIcon(course.icon ?? "pharmacy");
                  return (
                    <tr key={course.id} className="border-b border-[#E5EAF2] last:border-0 hover:bg-[#F7F9FC]/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
                            style={{ backgroundColor: course.icon_bg ?? "#EBF2FF" }}
                          >
                            <Icon className="h-5 w-5 text-[#0057FF]" strokeWidth={1.5} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[#002B7F]">{course.title}</p>
                            <p className="truncate text-[11px] text-[#9CA3AF]">{course.instructor ?? "No instructor"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[#6B7280]">{course.course_code ?? "—"}</td>
                      <td className="px-3 py-3 text-[#6B7280]">{course.category ?? "—"}</td>
                      <td className="px-3 py-3 text-[#374151]">{course.lessons_count ?? 0}</td>
                      <td className="px-3 py-3 text-[#374151]">{course.enrollments_count ?? 0}</td>
                      <td className="px-3 py-3 font-medium text-[#002B7F]">GHS {formatGhs(course.price)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                              course.is_published
                                ? "bg-[#DCFCE7] text-[#166534]"
                                : "bg-[#FEF3C7] text-[#92400E]"
                            }`}
                          >
                            {course.is_published ? "Published" : "Draft"}
                          </span>
                          {!course.is_active ? (
                            <span className="rounded-md bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-medium text-[#991B1B]">
                              Inactive
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[#9CA3AF]">{formatDate(course.created_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <ActionIcon label="Edit course" onClick={() => openEdit(course)}>
                            <Pencil className="h-4 w-4" />
                          </ActionIcon>
                          <ActionIcon
                            label={course.is_published ? "Unpublish course" : "Publish course"}
                            onClick={() => void handleTogglePublish(course)}
                            tone={course.is_published ? "warning" : "success"}
                          >
                            {course.is_published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </ActionIcon>
                          <ActionIcon
                            label="Upload lesson video"
                            href={`/admin/courses/upload?course=${course.slug}`}
                          >
                            <Video className="h-4 w-4" />
                          </ActionIcon>
                          {course.is_published ? (
                            <ActionIcon
                              label="View in store"
                              href={`/courses/${course.slug}/lessons`}
                              tone="default"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </ActionIcon>
                          ) : (
                            <ActionIcon label="Manage lessons" href={`/admin/lessons`}>
                              <BookOpen className="h-4 w-4" />
                            </ActionIcon>
                          )}
                          <ActionIcon label="Delete course" onClick={() => void handleDelete(course)} tone="danger">
                            <Trash2 className="h-4 w-4" />
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

      {editOpen && activeCourse ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[12px] bg-white shadow-xl">
            <div className="border-b border-[#E5EAF2] px-5 py-4">
              <h2 className="text-[17px] font-bold text-[#002B7F]">Edit Course</h2>
              <p className="mt-0.5 text-[12px] text-[#6B7280]">{activeCourse.slug}</p>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Title</label>
                <input
                  className="ed-input w-full"
                  value={editForm.title ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Course code</label>
                  <input
                    className="ed-input w-full"
                    value={editForm.course_code ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, course_code: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Price (GHS)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="ed-input w-full"
                    value={editForm.price ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Category</label>
                  <select
                    className="ed-input w-full"
                    value={editForm.category ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Difficulty</label>
                  <select
                    className="ed-input w-full"
                    value={editForm.difficulty ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, difficulty: e.target.value }))}
                  >
                    <option value="">Select difficulty</option>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Instructor</label>
                <select
                  className="ed-input w-full"
                  value={editForm.instructor ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, instructor: e.target.value }))}
                >
                  <option value="">Select instructor</option>
                  {INSTRUCTORS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Short description</label>
                <textarea
                  className="ed-input min-h-[88px] w-full resize-y py-2"
                  value={editForm.short_description ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, short_description: e.target.value }))}
                />
              </div>
              <label className="flex items-center justify-between rounded-[10px] border border-[#E5EAF2] px-3 py-2.5">
                <span className="text-[13px] text-[#374151]">Course is active in catalog</span>
                <input
                  type="checkbox"
                  checked={editForm.is_active ?? true}
                  onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-[#D1D5DB] text-[#0057FF]"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#E5EAF2] px-5 py-4">
              <button type="button" onClick={closeEdit} className="ed-btn-outline text-[13px]" disabled={submitting}>
                Cancel
              </button>
              <button type="button" onClick={() => void handleSaveEdit()} className="ed-btn-primary text-[13px]" disabled={submitting}>
                {submitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
