"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { ProgressBar } from "@/components/edamad/progress-bar";
import { getApiErrorMessage, getUploadErrorMessage } from "@/lib/auth-errors";
import { fetchAdminCourse, fetchAdminCourses, type AdminCourse } from "@/services/admin-courses";
import {
  deleteAdminMaterial,
  fetchAdminMaterials,
  uploadAdminMaterial,
  type AdminMaterial,
} from "@/services/admin-materials";

const typeLabels: Record<AdminMaterial["type"], string> = {
  video: "Video",
  document: "Document",
  image: "Image",
  slides: "Slides",
  notes: "Notes",
};

const typeStyles: Record<AdminMaterial["type"], string> = {
  video: "bg-[#EBF2FF] text-[#0057FF]",
  document: "bg-[#FEF3C7] text-[#92400E]",
  image: "bg-[#F3E8FF] text-[#7C3AED]",
  slides: "bg-[#FFEDD5] text-[#9A3412]",
  notes: "bg-[#DCFCE7] text-[#166534]",
};

function TypeIcon({ type }: { type: AdminMaterial["type"] }) {
  const className = "h-5 w-5";
  if (type === "video") return <Video className={className} strokeWidth={1.75} />;
  if (type === "image") return <ImageIcon className={className} strokeWidth={1.75} />;
  if (type === "slides" || type === "notes") return <FileText className={className} strokeWidth={1.75} />;
  return <Film className={className} strokeWidth={1.75} />;
}

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
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  const toneClass =
    tone === "danger"
      ? "text-[#DC2626] hover:bg-[#FEF2F2]"
      : "text-[#0057FF] hover:bg-[#EBF2FF]";

  const className = `rounded-lg p-2 transition-colors ${toneClass}`;

  if (href) {
    return (
      <Link href={href} target="_blank" title={label} aria-label={label} className={className}>
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

export function AdminMaterialsView() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [materials, setMaterials] = useState<AdminMaterial[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [lessonOptions, setLessonOptions] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | AdminMaterial["type"]>("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    courseId: "",
    lessonId: "",
    kind: "document" as "video" | "slides" | "notes" | "document" | "thumbnail" | "banner" | "other",
    file: null as File | null,
  });

  const stats = useMemo(
    () => ({
      total: materials.length,
      videos: materials.filter((m) => m.type === "video").length,
      documents: materials.filter((m) => m.type === "document" || m.type === "slides" || m.type === "notes").length,
      images: materials.filter((m) => m.type === "image").length,
    }),
    [materials],
  );

  const courseOptions = useMemo(() => {
    const fromMaterials = materials.map((m) => m.course);
    const fromCourses = courses.map((c) => c.title);
    return [...new Set([...fromMaterials, ...fromCourses])].sort();
  }, [courses, materials]);

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminMaterials({
      search: search || undefined,
      type: typeFilter,
      course: courseFilter === "all" ? undefined : courseFilter,
    })
      .then(setMaterials)
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load materials."));
        setMaterials([]);
      })
      .finally(() => setLoading(false));
  }, [courseFilter, search, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchAdminCourses()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (!uploadForm.courseId) {
      setLessonOptions([]);
      return;
    }
    fetchAdminCourse(Number(uploadForm.courseId))
      .then((detail) => {
        setLessonOptions(
          (detail.lessons ?? []).map((lesson: { id: number; title: string }) => ({
            id: lesson.id,
            title: lesson.title,
          })),
        );
      })
      .catch(() => setLessonOptions([]));
  }, [uploadForm.courseId]);

  function openUpload() {
    setUploadForm({
      courseId: courses[0]?.id ? String(courses[0].id) : "",
      lessonId: "",
      kind: "document",
      file: null,
    });
    setUploadProgress(0);
    setUploadError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setUploadForm({ courseId: "", lessonId: "", kind: "document", file: null });
    setUploadProgress(0);
    setUploadError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload() {
    if (!uploadForm.courseId) {
      toast.error("Select a course.");
      return;
    }
    if (!uploadForm.file) {
      toast.error("Choose a file to upload.");
      return;
    }
    const needsLesson = ["video", "slides", "notes", "document", "other"].includes(uploadForm.kind);
    if (needsLesson && !uploadForm.lessonId) {
      toast.error("Select a lesson for this material type.");
      return;
    }

    setSubmitting(true);
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const res = await uploadAdminMaterial(
        {
          course_id: Number(uploadForm.courseId),
          lesson_id: uploadForm.lessonId ? Number(uploadForm.lessonId) : undefined,
          kind: uploadForm.kind,
          name: uploadForm.file.name,
          file: uploadForm.file,
        },
        setUploadProgress,
      );
      toast.success(res.message);
      setMaterials(res.materials);
      closeModal();
      load();
    } catch (error) {
      const message = getUploadErrorMessage(error, "Upload failed. Please try again.");
      setUploadError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  async function handleDelete(material: AdminMaterial) {
    if (!window.confirm(`Remove "${material.name}" from ${material.course}?`)) return;

    try {
      const res = await deleteAdminMaterial(material.id);
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to remove material."));
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">Learning Materials</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Manage videos, PDFs, slides, thumbnails, and supplementary lesson files.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/courses/upload" className="ed-btn-outline gap-2 text-[13px]">
            <Video className="h-4 w-4" />
            Video Upload
          </Link>
          <button type="button" onClick={openUpload} className="ed-btn-primary gap-2 text-[13px]">
            <Plus className="h-4 w-4" />
            Upload Material
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total materials", value: stats.total },
          { label: "Videos", value: stats.videos },
          { label: "Documents", value: stats.documents },
          { label: "Images", value: stats.images },
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
            placeholder="Search by name, course, or lesson..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <select
          className="ed-input w-auto min-w-[130px]"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
        >
          <option value="all">All types</option>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="ed-input w-auto min-w-[160px]"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="all">All courses</option>
          {courseOptions.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>
        <button type="button" onClick={load} className="ed-btn-outline text-[13px]">
          Search
        </button>
      </div>

      {loading ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">Loading materials...</div>
      ) : materials.length === 0 ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">
          No materials found.{" "}
          <button type="button" onClick={openUpload} className="font-medium text-[#0057FF] hover:underline">
            Upload your first file
          </button>
        </div>
      ) : (
        <div className="ed-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-[13px]">
              <thead>
                <tr className="border-b border-[#E5EAF2] bg-[#F7F9FC] text-left text-[#6B7280]">
                  <th className="px-5 py-3 font-medium">Material</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Course</th>
                  <th className="px-3 py-3 font-medium">Lesson</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Updated</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <tr key={material.id} className="border-b border-[#E5EAF2] last:border-0 hover:bg-[#F7F9FC]/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${typeStyles[material.type]}`}>
                          <TypeIcon type={material.type} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#002B7F]">{material.name}</p>
                          <p className="truncate text-[11px] text-[#9CA3AF]">{material.url || "No URL"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${typeStyles[material.type]}`}>
                        {typeLabels[material.type]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/courses?search=${encodeURIComponent(material.course)}`}
                        className="text-[#0057FF] hover:underline"
                      >
                        {material.course}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-[#6B7280]">{material.lesson ?? "—"}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${
                          material.status === "published"
                            ? "bg-[#DCFCE7] text-[#166534]"
                            : "bg-[#FEF3C7] text-[#92400E]"
                        }`}
                      >
                        {material.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[#9CA3AF]">{formatDate(material.updated_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        {material.url ? (
                          <ActionIcon label="Open file" href={material.url}>
                            <ExternalLink className="h-4 w-4" />
                          </ActionIcon>
                        ) : null}
                        {material.course_slug && material.lesson ? (
                          <ActionIcon
                            label="View course"
                            href={`/courses/${material.course_slug}/lessons`}
                          >
                            <BookOpen className="h-4 w-4" />
                          </ActionIcon>
                        ) : null}
                        <ActionIcon label="Remove material" onClick={() => void handleDelete(material)} tone="danger">
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
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[12px] bg-white shadow-xl">
            <div className="border-b border-[#E5EAF2] px-5 py-4">
              <h2 className="text-[17px] font-bold text-[#002B7F]">Upload Material</h2>
              <p className="mt-0.5 text-[12px] text-[#6B7280]">Attach a file to a course or lesson.</p>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Course</label>
                <select
                  className="ed-input w-full"
                  value={uploadForm.courseId}
                  onChange={(e) => setUploadForm((f) => ({ ...f, courseId: e.target.value, lessonId: "" }))}
                  disabled={uploading}
                >
                  <option value="">Select course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Material type</label>
                <select
                  className="ed-input w-full"
                  value={uploadForm.kind}
                  onChange={(e) =>
                    setUploadForm((f) => ({
                      ...f,
                      kind: e.target.value as typeof uploadForm.kind,
                    }))
                  }
                  disabled={uploading}
                >
                  <option value="video">Video lesson file</option>
                  <option value="slides">PDF slides</option>
                  <option value="notes">Notes / handouts</option>
                  <option value="document">Document</option>
                  <option value="thumbnail">Course thumbnail</option>
                  <option value="banner">Course banner</option>
                  <option value="other">Other file</option>
                </select>
              </div>
              {!["thumbnail", "banner"].includes(uploadForm.kind) ? (
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Lesson</label>
                  <select
                    className="ed-input w-full"
                    value={uploadForm.lessonId}
                    onChange={(e) => setUploadForm((f) => ({ ...f, lessonId: e.target.value }))}
                    disabled={uploading || !uploadForm.courseId}
                  >
                    <option value="">Select lesson</option>
                    {lessonOptions.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">File</label>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="ed-btn-outline w-full gap-2 text-[13px] disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />
                  {uploadForm.file ? uploadForm.file.name : "Choose file"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setUploadForm((f) => ({ ...f, file }));
                    setUploadError(null);
                  }}
                />
              </div>

              {uploading ? (
                <div className="rounded-[10px] border border-[#E5EAF2] bg-[#F7F9FC] p-4">
                  <div className="mb-2 flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2 font-medium text-[#002B7F]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#0057FF]" />
                      Uploading...
                    </span>
                    <span className="font-semibold text-[#0057FF]">{uploadProgress}%</span>
                  </div>
                  <ProgressBar value={uploadProgress} height={10} />
                </div>
              ) : null}

              {uploadError ? (
                <div className="rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[12px] text-[#B91C1C]">
                  {uploadError}
                </div>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#E5EAF2] px-5 py-4">
              <button type="button" onClick={closeModal} className="ed-btn-outline text-[13px]" disabled={uploading}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleUpload()}
                className="ed-btn-primary text-[13px] disabled:opacity-60"
                disabled={submitting || uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
