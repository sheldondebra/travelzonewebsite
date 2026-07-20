"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Clock,
  CloudUpload,
  GripVertical,
  Pencil,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Breadcrumbs } from "@/components/edamad/breadcrumbs";
import { ProgressBar } from "@/components/edamad/progress-bar";
import { RichTextEditor } from "@/components/edamad/rich-text-editor";
import {
  COURSE_CATEGORIES,
  DIFFICULTY_LEVELS,
  INSTRUCTORS,
  buildChecklist,
  checklistProgress,
  clearCourseDraft,
  defaultCourseForm,
  loadCourseDraft,
  moduleDurationLabel,
  saveCourseDraft,
  uid,
  type CourseFormState,
  type ModuleDraft,
} from "@/lib/create-course-data";
import { createCourse, uploadCourseMedia } from "@/services/admin-courses";
import { fetchAdminCategories } from "@/services/admin-categories";
import { useAuthStore } from "@/store/auth-store";

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">
      {children} <span className="text-[#EF4444]">*</span>
    </label>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-[#0057FF]" : "bg-[#D1D5DB]"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

export function CreateCourseView() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const [form, setForm] = useState<CourseFormState>(defaultCourseForm);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [lessonDraft, setLessonDraft] = useState({
    title: "",
    type: "video" as "video" | "pdf" | "pptx",
    durationMinutes: 15,
    file: null as File | null,
  });
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dragObjectiveId, setDragObjectiveId] = useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([...COURSE_CATEGORIES]);
  const thumbnailRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const lessonFileRef = useRef<HTMLInputElement>(null);

  const createdDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  const checklist = useMemo(() => buildChecklist(form), [form]);
  const progress = checklistProgress(checklist);

  useEffect(() => {
    const draft = loadCourseDraft();
    if (draft) setForm(draft);
  }, []);

  useEffect(() => {
    fetchAdminCategories({ status: "active" })
      .then((items) => {
        if (items.length > 0) {
          setCategoryOptions(items.map((item) => item.name));
        }
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  useEffect(() => {
    if (form.modules.length && !selectedModuleId) {
      setSelectedModuleId(form.modules[0].id);
    }
  }, [form.modules, selectedModuleId]);

  function patch(partial: Partial<CourseFormState>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  async function handleImageUpload(type: "thumbnail" | "banner", file: File) {
    const maxMb = type === "thumbnail" ? 2 : 5;
    if (file.size > maxMb * 1024 * 1024) {
      showToast(`File exceeds ${maxMb}MB limit.`);
      return;
    }
    setUploading(type);
    try {
      const preview = URL.createObjectURL(file);
      const url = await uploadCourseMedia(type, file);
      if (type === "thumbnail") patch({ thumbnailUrl: url, thumbnailPreview: preview });
      else patch({ bannerUrl: url, bannerPreview: preview });
      showToast(`${type === "thumbnail" ? "Thumbnail" : "Banner"} uploaded.`);
    } catch {
      const preview = URL.createObjectURL(file);
      if (type === "thumbnail") patch({ thumbnailPreview: preview });
      else patch({ bannerPreview: preview });
      showToast("Upload saved locally. Sign in as admin to sync to server.");
    } finally {
      setUploading(null);
    }
  }

  function addObjective() {
    patch({ objectives: [...form.objectives, { id: uid("obj"), text: "" }] });
  }

  function reorderObjectives(fromId: string, toId: string) {
    if (fromId === toId) return;
    const items = [...form.objectives];
    const fromIndex = items.findIndex((o) => o.id === fromId);
    const toIndex = items.findIndex((o) => o.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    patch({ objectives: items });
  }

  function addModule() {
    const mod: ModuleDraft = {
      id: uid("mod"),
      title: `Module ${form.modules.length + 1}: New Module`,
      lessons: [],
    };
    patch({ modules: [...form.modules, mod] });
    setSelectedModuleId(mod.id);
  }

  function deleteModule(id: string) {
    const next = form.modules.filter((m) => m.id !== id);
    patch({ modules: next });
    if (selectedModuleId === id) setSelectedModuleId(next[0]?.id ?? "");
  }

  function saveModuleTitle(id: string) {
    patch({
      modules: form.modules.map((m) => (m.id === id ? { ...m, title: editingModuleTitle } : m)),
    });
    setEditingModuleId(null);
  }

  async function addLesson() {
    if (!selectedModuleId || !lessonDraft.title.trim()) {
      showToast("Select a module and enter a lesson title.");
      return;
    }
    let contentUrl: string | undefined;
    let contentFileName: string | undefined;
    if (lessonDraft.file) {
      setUploading("lesson");
      try {
        contentUrl = await uploadCourseMedia("lesson", lessonDraft.file);
        contentFileName = lessonDraft.file.name;
      } catch {
        contentFileName = lessonDraft.file.name;
        showToast("Lesson file saved in draft. Upload requires admin login.");
      } finally {
        setUploading(null);
      }
    }
    patch({
      modules: form.modules.map((m) =>
        m.id === selectedModuleId
          ? {
              ...m,
              lessons: [
                ...m.lessons,
                {
                  id: uid("les"),
                  title: lessonDraft.title,
                  type: lessonDraft.type,
                  durationMinutes: lessonDraft.durationMinutes,
                  contentUrl,
                  contentFileName,
                },
              ],
            }
          : m,
      ),
    });
    setLessonDraft({ title: "", type: "video", durationMinutes: 15, file: null });
    showToast("Lesson added to module.");
  }

  function handleSaveDraft() {
    saveCourseDraft(form);
    showToast("Draft saved successfully.");
  }

  async function handlePublish(publish: boolean) {
    if (!form.title.trim()) {
      showToast("Course title is required.");
      return;
    }
    setSaving(true);
    try {
      await createCourse(form, publish);
      clearCourseDraft();
      showToast(publish ? "Course published!" : "Course saved as draft.");
      router.push("/admin/courses");
    } catch {
      saveCourseDraft(form);
      showToast("Saved locally. Log in as admin@edamad.com to publish to the server.");
    } finally {
      setSaving(false);
    }
  }

  const selectedModule = form.modules.find((m) => m.id === selectedModuleId);

  return (
    <div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-[10px] bg-[#002B7F] px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Courses", href: "/admin/courses" },
          { label: "Create Course" },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">Create Course</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">Add course details, modules, and lessons.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleSaveDraft} className="ed-btn-outline gap-2 text-[13px]">
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handlePublish(true)}
            className="ed-btn-primary gap-2 text-[13px] disabled:opacity-70"
          >
            <Send className="h-4 w-4" />
            {saving ? "Publishing..." : "Publish Course"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {/* Basic Information */}
          <div className="ed-card p-5">
            <h2 className="mb-4 text-[15px] font-semibold text-[#002B7F]">Basic Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <RequiredLabel>Course Title</RequiredLabel>
                <input
                  className="ed-input w-full"
                  value={form.title}
                  onChange={(e) => patch({ title: e.target.value })}
                />
              </div>
              <div>
                <RequiredLabel>Course Code</RequiredLabel>
                <input
                  className="ed-input w-full"
                  value={form.courseCode}
                  onChange={(e) => patch({ courseCode: e.target.value })}
                />
              </div>
              <div>
                <RequiredLabel>Category</RequiredLabel>
                <select
                  className="ed-input w-full"
                  value={form.category}
                  onChange={(e) => patch({ category: e.target.value })}
                >
                  {categoryOptions.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <RequiredLabel>Instructor</RequiredLabel>
                <select
                  className="ed-input w-full"
                  value={form.instructor}
                  onChange={(e) => patch({ instructor: e.target.value })}
                >
                  {INSTRUCTORS.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">
                  Difficulty Level
                </label>
                <select
                  className="ed-input w-full"
                  value={form.difficulty}
                  onChange={(e) => patch({ difficulty: e.target.value })}
                >
                  {DIFFICULTY_LEVELS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Duration</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    className="ed-input w-full pl-9"
                    value={form.duration}
                    onChange={(e) => patch({ duration: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <RequiredLabel>Price (USD)</RequiredLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">$</span>
                  <input
                    className="ed-input w-full pl-7"
                    value={form.price}
                    onChange={(e) => patch({ price: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-end gap-3 pb-1">
                <Toggle checked={form.isActive} onChange={(v) => patch({ isActive: v })} />
                <span className="text-[13px] font-medium text-[#374151]">Active</span>
              </div>
            </div>
          </div>

          {/* Descriptions */}
          <div className="ed-card space-y-4 p-5">
            <h2 className="text-[15px] font-semibold text-[#002B7F]">Descriptions</h2>
            <div>
              <RequiredLabel>Short Description</RequiredLabel>
              <textarea
                className="min-h-[80px] w-full rounded-[10px] border border-[#E5EAF2] p-3 text-[13px] focus:border-[#0057FF] focus:outline-none focus:ring-2 focus:ring-[#0057FF]/20"
                maxLength={160}
                value={form.shortDescription}
                onChange={(e) => patch({ shortDescription: e.target.value })}
              />
              <p className="mt-1 text-right text-[11px] text-[#9CA3AF]">
                {form.shortDescription.length}/160
              </p>
            </div>
            <div>
              <RequiredLabel>Full Description</RequiredLabel>
              <RichTextEditor
                value={form.fullDescription}
                onChange={(html) => patch({ fullDescription: html })}
                placeholder="Describe the course in detail..."
              />
            </div>
          </div>

          {/* Thumbnail + Objectives */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="ed-card p-5">
              <h2 className="mb-3 text-[15px] font-semibold text-[#002B7F]">Course Thumbnail</h2>
              <div
                className="flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-[#0057FF] bg-[#F7F9FC] p-6"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) void handleImageUpload("thumbnail", file);
                }}
              >
                {form.thumbnailPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.thumbnailPreview}
                    alt="Thumbnail preview"
                    className="mb-3 h-24 w-full rounded-lg object-cover"
                  />
                ) : (
                  <CloudUpload className="h-10 w-10 text-[#0057FF]" />
                )}
                <p className="mt-2 text-center text-[12px] text-[#6B7280]">
                  Upload Thumbnail. PNG, JPG or WEBP (Max 2MB)
                </p>
                <button
                  type="button"
                  disabled={uploading === "thumbnail"}
                  onClick={() => thumbnailRef.current?.click()}
                  className="ed-btn-outline mt-3 text-[13px]"
                >
                  {uploading === "thumbnail" ? "Uploading..." : "Choose File"}
                </button>
                <input
                  ref={thumbnailRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageUpload("thumbnail", file);
                  }}
                />
              </div>
            </div>

            <div className="ed-card p-5">
              <h2 className="mb-3 text-[15px] font-semibold text-[#002B7F]">Learning Objectives</h2>
              <ul className="space-y-2">
                {form.objectives.map((obj) => (
                  <li
                    key={obj.id}
                    draggable
                    onDragStart={() => setDragObjectiveId(obj.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragObjectiveId) reorderObjectives(dragObjectiveId, obj.id);
                      setDragObjectiveId(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[#9CA3AF]" />
                    <input
                      className="ed-input min-w-0 flex-1"
                      value={obj.text}
                      onChange={(e) =>
                        patch({
                          objectives: form.objectives.map((o) =>
                            o.id === obj.id ? { ...o, text: e.target.value } : o,
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        patch({ objectives: form.objectives.filter((o) => o.id !== obj.id) })
                      }
                      className="text-[#9CA3AF] hover:text-[#EF4444]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={addObjective} className="mt-3 text-[13px] font-medium text-[#0057FF]">
                <Plus className="mr-1 inline h-4 w-4" />
                Add Objective
              </button>
            </div>
          </div>

          {/* Modules & Lessons */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="ed-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-[#002B7F]">Course Outline / Modules</h2>
              </div>
              <ul className="space-y-2">
                {form.modules.map((mod) => (
                  <li
                    key={mod.id}
                    className={`rounded-[10px] border p-3 ${selectedModuleId === mod.id ? "border-[#0057FF] bg-[#EBF2FF]/40" : "border-[#E5EAF2]"}`}
                    onClick={() => setSelectedModuleId(mod.id)}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" />
                      <div className="min-w-0 flex-1">
                        {editingModuleId === mod.id ? (
                          <input
                            className="ed-input w-full"
                            value={editingModuleTitle}
                            onChange={(e) => setEditingModuleTitle(e.target.value)}
                            onBlur={() => saveModuleTitle(mod.id)}
                            onKeyDown={(e) => e.key === "Enter" && saveModuleTitle(mod.id)}
                            autoFocus
                          />
                        ) : (
                          <p className="text-[13px] font-semibold text-[#002B7F]">{mod.title}</p>
                        )}
                        <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
                          {mod.lessons.length} Lessons • {moduleDurationLabel(mod.lessons)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingModuleId(mod.id);
                          setEditingModuleTitle(mod.title);
                        }}
                        className="text-[#6B7280] hover:text-[#0057FF]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteModule(mod.id);
                        }}
                        className="text-[#6B7280] hover:text-[#EF4444]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={addModule} className="mt-3 text-[13px] font-medium text-[#0057FF]">
                <Plus className="mr-1 inline h-4 w-4" />
                Add Module
              </button>
            </div>

            <div className="ed-card p-5">
              <h2 className="mb-4 text-[15px] font-semibold text-[#002B7F]">Create New Lesson</h2>
              {selectedModule ? (
                <p className="mb-3 text-[12px] text-[#6B7280]">Adding to: {selectedModule.title}</p>
              ) : (
                <p className="mb-3 text-[12px] text-[#EF4444]">Select a module first.</p>
              )}
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">Lesson Title</label>
                  <input
                    className="ed-input w-full"
                    value={lessonDraft.title}
                    onChange={(e) => setLessonDraft((d) => ({ ...d, title: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">Lesson Type</label>
                    <select
                      className="ed-input w-full"
                      value={lessonDraft.type}
                      onChange={(e) =>
                        setLessonDraft((d) => ({
                          ...d,
                          type: e.target.value as "video" | "pdf" | "pptx",
                        }))
                      }
                    >
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                      <option value="pptx">PPTX</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="ed-input w-full"
                      value={lessonDraft.durationMinutes}
                      onChange={(e) =>
                        setLessonDraft((d) => ({ ...d, durationMinutes: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">Content Upload</label>
                  <button
                    type="button"
                    onClick={() => lessonFileRef.current?.click()}
                    className="ed-btn-outline w-full gap-2 text-[13px]"
                  >
                    <Upload className="h-4 w-4" />
                    {lessonDraft.file ? lessonDraft.file.name : "Upload File"}
                  </button>
                  <p className="mt-1 text-[11px] text-[#9CA3AF]">MP4, PDF, PPTX (Max 500MB)</p>
                  <input
                    ref={lessonFileRef}
                    type="file"
                    accept=".mp4,.pdf,.ppt,.pptx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setLessonDraft((d) => ({ ...d, file }));
                    }}
                  />
                </div>
                <button
                  type="button"
                  disabled={uploading === "lesson"}
                  onClick={() => void addLesson()}
                  className="ed-btn-primary w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Lesson
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="ed-card overflow-hidden p-0">
            <div className="bg-[#EBF2FF] px-4 py-2 text-[12px] font-semibold text-[#002B7F]">Course Preview</div>
            <div className="p-4">
              <div className="mb-3 h-28 overflow-hidden rounded-lg bg-[#E5EAF2]">
                {form.thumbnailPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.thumbnailPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[12px] text-[#9CA3AF]">
                    No thumbnail
                  </div>
                )}
              </div>
              <p className="text-[14px] font-bold text-[#002B7F]">{form.title || "Course Title"}</p>
              <p className="mt-1 text-[12px] text-[#6B7280]">
                {form.difficulty} • {form.duration}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0057FF] text-[11px] font-bold text-white">
                  {form.instructor
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <p className="text-[12px] text-[#374151]">{form.instructor}</p>
              </div>
              <p className="mt-3 text-[18px] font-bold text-[#0057FF]">${form.price || "0.00"}</p>
            </div>
          </div>

          <div className="ed-card p-4">
            <h3 className="font-semibold text-[#002B7F]">Completion Checklist</h3>
            <ul className="mt-3 space-y-2">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-[13px]">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22C55E]" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-[#D1D5DB]" />
                  )}
                  <span className={item.done ? "text-[#374151]" : "text-[#6B7280]"}>{item.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-[#6B7280]">Overall completion</p>
            <ProgressBar value={progress} className="mt-1.5" />
          </div>

          <div className="ed-card p-4">
            <h3 className="mb-3 font-semibold text-[#002B7F]">Course Banner</h3>
            <div
              className="flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-[#E5EAF2] p-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) void handleImageUpload("banner", file);
              }}
            >
              {form.bannerPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.bannerPreview} alt="" className="mb-2 h-16 w-full rounded object-cover" />
              ) : null}
              <p className="text-center text-[11px] text-[#6B7280]">Recommended: 1200×400px (Max 5MB)</p>
              <button
                type="button"
                disabled={uploading === "banner"}
                onClick={() => bannerRef.current?.click()}
                className="ed-btn-outline mt-2 text-[12px]"
              >
                Upload Banner
              </button>
              <input
                ref={bannerRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImageUpload("banner", file);
                }}
              />
            </div>
          </div>

          <div className="ed-card p-4 text-[12px]">
            <h3 className="mb-3 font-semibold text-[#002B7F]">Course Information</h3>
            <dl className="space-y-2 text-[#6B7280]">
              <div className="flex justify-between gap-2">
                <dt>Created by</dt>
                <dd className="font-medium text-[#374151]">{authUser?.name ?? "Admin"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Created on</dt>
                <dd className="font-medium text-[#374151]">{createdDate}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Last updated</dt>
                <dd className="font-medium text-[#374151]">{createdDate}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Visibility</dt>
                <dd className="font-medium capitalize text-[#374151]">{form.visibility}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Enrollment</dt>
                <dd className="font-medium text-[#374151]">0 Students</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
