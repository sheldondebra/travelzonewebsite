"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  CloudUpload,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Lightbulb,
  Loader2,
  Paperclip,
  Save,
  Send,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/edamad/breadcrumbs";
import { ProgressBar } from "@/components/edamad/progress-bar";
import { RichTextEditor } from "@/components/edamad/rich-text-editor";
import { RightPanel } from "@/components/edamad/right-panel";
import { getApiErrorMessage, getUploadErrorMessage } from "@/lib/auth-errors";
import {
  ACCESS_TYPES,
  DEFAULT_COURSE,
  INSTRUCTORS,
  MODULES,
  PUBLISH_STATUSES,
  buildUploadChecklist,
  defaultVideoForm,
  durationFromVideoFile,
  formatBytes,
  loadVideoDraft,
  loadVideoLibrary,
  parseDurationToSeconds,
  saveVideoDraft,
  saveVideoLibrary,
  type LibraryVideo,
  type PublishMode,
  type VideoMetadata,
  type VideoUploadForm,
} from "@/lib/video-upload-data";
import {
  createVideoLesson,
  fetchAdminCourses,
  fetchAdminCourse,
  uploadCourseMedia,
  uploadVideo,
} from "@/services/admin-courses";

type CourseContext = typeof DEFAULT_COURSE;

function LibraryModal({
  open,
  items,
  onClose,
  onSelect,
}: {
  open: boolean;
  items: LibraryVideo[];
  onClose: () => void;
  onSelect: (item: LibraryVideo) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-[12px] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E5EAF2] px-5 py-4">
          <h3 className="text-[17px] font-bold text-[#002B7F]">Upload from Library</h3>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5 text-[#6B7280]" />
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="mb-2 w-full rounded-[10px] border border-[#E5EAF2] p-3 text-left hover:bg-[#F7F9FC]"
              >
                <p className="text-[13px] font-semibold text-[#002B7F]">{item.name}</p>
                <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
                  {item.size} • {item.duration}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PreviewModal({ open, form, course, onClose }: { open: boolean; form: VideoUploadForm; course: CourseContext; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[17px] font-bold text-[#002B7F]">Lesson Preview</h3>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-[12px] text-[#6B7280]">{course.title} • {form.lessonNumber}</p>
        <h4 className="mt-2 text-[16px] font-bold text-[#002B7F]">{form.videoTitle}</h4>
        <p className="mt-1 text-[13px] text-[#6B7280]">{form.module}</p>
        <div className="mt-4 rounded-lg bg-[#F7F9FC] p-4 text-[13px] text-[#374151]" dangerouslySetInnerHTML={{ __html: form.description }} />
        <button type="button" onClick={onClose} className="ed-btn-primary mt-5 w-full">
          Close Preview
        </button>
      </div>
    </div>
  );
}

function UploadProgressBlock({
  fileName,
  progress,
  loaded,
  total,
  uploading,
  error,
  onRetry,
}: {
  fileName?: string;
  progress: number;
  loaded: number;
  total: number;
  uploading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (!fileName && !uploading && !error) return null;

  return (
    <div className="mt-6 w-full max-w-lg">
      {fileName ? (
        <p className="mb-2 truncate text-center text-[12px] font-medium text-[#374151]">{fileName}</p>
      ) : null}

      {uploading ? (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-[#0057FF]">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[13px] font-semibold">Uploading...</span>
            <span className="text-[13px] font-semibold">{progress}%</span>
          </div>
          <ProgressBar value={progress} height={12} />
          <p className="text-center text-[11px] text-[#6B7280]">
            {formatBytes(loaded)} / {formatBytes(total || loaded || 1)}
            {progress > 0 ? ` (${progress}%)` : ""}
          </p>
          <p className="text-center text-[11px] font-medium text-[#0057FF]">
            Please keep this page open until the upload finishes.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-left">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#991B1B]">Upload failed</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#B91C1C]">{error}</p>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 text-[12px] font-semibold text-[#0057FF] hover:underline"
                >
                  Try again
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {!uploading && !error && progress >= 100 ? (
        <p className="mt-2 text-center text-[12px] font-medium text-[#16A34A]">Upload complete</p>
      ) : null}
    </div>
  );
}

export function VideoUploadView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseSlug = searchParams.get("course");
  const videoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const slidesRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLInputElement>(null);
  const otherRef = useRef<HTMLInputElement>(null);

  const [course, setCourse] = useState<CourseContext | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [form, setForm] = useState<VideoUploadForm>(defaultVideoForm);
  const [tagInput, setTagInput] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [library, setLibrary] = useState<LibraryVideo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadLoaded, setUploadLoaded] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [videoMeta, setVideoMeta] = useState<VideoMetadata | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [supplementaryUpload, setSupplementaryUpload] = useState<{
    label: string;
    progress: number;
  } | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

  const checklist = useMemo(() => buildUploadChecklist(form, uploadComplete), [form, uploadComplete]);

  useEffect(() => {
    const draft = loadVideoDraft();
    if (draft) setForm(draft);
    setLibrary(loadVideoLibrary());

    setCourseLoading(true);
    fetchAdminCourses()
      .then((courses) => {
        const match =
          (courseSlug ? courses.find((c) => c.slug === courseSlug) : null) ?? courses[0];
        if (!match) {
          setCourse(null);
          return;
        }
        return fetchAdminCourse(match.id).then((detail) => {
          setCourse({
            id: detail.id,
            title: detail.title,
            course_code: detail.course_code ?? "",
            slug: detail.slug,
            is_active: detail.is_active ?? true,
            modules_count: detail.modules?.length ?? 0,
            lessons_count: detail.lessons_count ?? detail.lessons?.length ?? 0,
            duration_label: detail.duration_label ?? "",
            thumbnail_url: detail.thumbnail_url ?? "",
          });
          setForm((f) => ({ ...f, courseId: detail.id }));
        });
      })
      .catch(() => {
        setCourse(null);
        toast.error("Unable to load course details. Log in as admin and try again.");
      })
      .finally(() => setCourseLoading(false));
  }, [courseSlug]);

  function patch(partial: Partial<VideoUploadForm>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function resetVideoInput() {
    if (videoRef.current) videoRef.current.value = "";
  }

  async function processVideoFile(file: File) {
    const allowed = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp4|mov|avi|webm)$/i)) {
      setUploadError("Accepted formats: MP4, MOV, AVI, and WebM.");
      toast.error("Accepted formats: MP4, MOV, AVI, and WebM.");
      return;
    }
    if (file.size > 5 * 1024 * 1024 * 1024) {
      setUploadError("Maximum file size is 5GB.");
      toast.error("Maximum file size is 5GB.");
      return;
    }

    patch({ videoFile: file, videoFileName: file.name, videoUrl: "" });
    setUploadTotal(file.size);
    setUploadLoaded(0);
    setUploadProgress(0);
    setUploading(true);
    setUploadComplete(false);
    setUploadError(null);
    setVideoMeta(null);

    const duration = await durationFromVideoFile(file);
    patch({ duration });

    try {
      const result = await uploadVideo(file, (pct) => {
        setUploadProgress(pct);
        setUploadLoaded(Math.round((file.size * pct) / 100));
      });
      patch({ videoUrl: result.url });
      setVideoMeta({
        format: result.format,
        resolution: "1920×1080",
        duration,
        fileSize: formatBytes(result.size),
        bitrate: "8.2 Mbps",
      });
      setUploadComplete(true);
      setUploadProgress(100);
      setUploadLoaded(file.size);

      const lib = loadVideoLibrary();
      if (!lib.find((l) => l.name === result.filename)) {
        const next = [
          { id: `lib-${Date.now()}`, name: result.filename, size: formatBytes(result.size), duration, url: result.url },
          ...lib,
        ];
        saveVideoLibrary(next);
        setLibrary(next);
      }
      toast.success("Video uploaded successfully.");
    } catch (error) {
      setUploadComplete(false);
      setUploadProgress(0);
      setUploadLoaded(0);
      patch({ videoUrl: "" });
      const message = getUploadErrorMessage(error, "Video upload failed. Please try again.");
      setUploadError(message);
      toast.error(message);
      resetVideoInput();
    } finally {
      setUploading(false);
    }
  }

  function selectLibraryVideo(item: LibraryVideo) {
    patch({
      videoFileName: item.name,
      duration: item.duration,
      videoUrl: item.url ?? "",
    });
    setUploadTotal(parseSize(item.size));
    setUploadLoaded(parseSize(item.size));
    setUploadProgress(100);
    setUploadComplete(true);
    setUploadError(null);
    setVideoMeta({
      format: "MP4",
      resolution: "1920×1080",
      duration: item.duration,
      fileSize: item.size,
      bitrate: "8.2 Mbps",
    });
    toast.success(`Selected ${item.name} from library.`);
  }

  function parseSize(label: string): number {
    const n = parseFloat(label);
    if (label.includes("GB")) return n * 1e9;
    if (label.includes("MB")) return n * 1e6;
    return n * 1e3;
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag)) return;
    patch({ tags: [...form.tags, tag] });
    setTagInput("");
  }

  async function uploadSupplementary(type: "slides" | "notes" | "other", file: File) {
    const label = type === "slides" ? "PDF slides" : type === "notes" ? "Notes / handouts" : "File";
    setSupplementaryUpload({ label: file.name, progress: 0 });
    try {
      const url = await uploadCourseMedia("lesson", file, (pct) => {
        setSupplementaryUpload({ label: file.name, progress: pct });
      });
      patch({
        supplementary: [
          ...form.supplementary,
          { id: `sup-${Date.now()}`, type, name: file.name, url },
        ],
      });
      toast.success(`${file.name} uploaded.`);
    } catch (error) {
      const message = getUploadErrorMessage(error, `Failed to upload ${label.toLowerCase()}.`);
      toast.error(message);
    } finally {
      setSupplementaryUpload(null);
    }
  }

  async function handleThumbnail(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      const message = "Thumbnail max size is 2MB.";
      setThumbnailError(message);
      toast.error(message);
      return;
    }
    const preview = URL.createObjectURL(file);
    setThumbnailUploading(true);
    setThumbnailError(null);
    try {
      const url = await uploadCourseMedia("thumbnail", file, () => undefined);
      patch({ thumbnailUrl: url, thumbnailPreview: preview });
      toast.success("Thumbnail uploaded.");
    } catch (error) {
      const message = getUploadErrorMessage(error, "Thumbnail upload failed.");
      setThumbnailError(message);
      toast.error(message);
      patch({ thumbnailPreview: preview });
    } finally {
      setThumbnailUploading(false);
    }
  }

  function handleSaveDraft() {
    saveVideoDraft(form);
    toast.success("Draft saved.");
  }

  async function handleSubmit(publish: boolean) {
    if (!form.lessonTitle.trim()) {
      toast.error("Lesson title is required.");
      return;
    }
    if (uploading) {
      toast.error("Wait for the video upload to finish before publishing.");
      return;
    }
    if (!form.videoUrl && !uploadComplete) {
      toast.error("Upload a video before publishing this lesson.");
      return;
    }
    if (!form.courseId) {
      saveVideoDraft(form);
      toast.error("No course selected. Choose a course from the courses page and try again.");
      return;
    }

    setSaving(true);
    try {
      await createVideoLesson({
        course_id: form.courseId,
        title: form.lessonTitle,
        video_title: form.videoTitle,
        module_title: form.module,
        lesson_number: form.lessonNumber,
        description: form.description,
        video_url: form.videoUrl || null,
        lesson_thumbnail_url: form.thumbnailUrl || null,
        duration_seconds: parseDurationToSeconds(form.duration),
        tags: form.tags,
        access_type: form.accessType.toLowerCase(),
        publish_status: publish ? "published" : form.publishStatus.toLowerCase(),
        supplementary_files: form.supplementary,
        scheduled_at: form.publishMode === "schedule" ? form.scheduledDate : null,
        video_metadata: videoMeta,
        publish_now: publish || form.publishMode === "publish_now",
      });
      toast.success(publish ? "Video published!" : "Video saved as draft.");
      router.push("/admin/courses");
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to save lesson. Ensure you are logged in as admin.");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (courseLoading) {
    return <div className="ed-card p-8 text-center text-[#6B7280]">Loading course upload tools...</div>;
  }

  if (!course) {
    return (
      <div className="ed-card p-8 text-center">
        <p className="text-[15px] font-semibold text-[#002B7F]">No course selected</p>
        <p className="mt-2 text-[13px] text-[#6B7280]">
          Create a course first, then return here to upload lesson videos.
        </p>
        <Link href="/admin/courses/create" className="ed-btn-primary mt-4 inline-flex">
          Create Course
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Courses", href: "/admin/courses" },
          { label: course.title, href: `/courses/${course.slug}/lessons/1` },
          { label: "Video Upload" },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#002B7F]">Course Video Upload</h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          Upload and organize lesson videos for your course content.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {/* Course summary */}
          <div className="ed-card flex flex-wrap items-center gap-4 p-4">
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-[#EBF2FF]">
              {course.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[15px] font-semibold text-[#002B7F]">{course.title}</p>
                {course.is_active && (
                  <span className="rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold uppercase text-[#166534]">
                    Active
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12px] text-[#6B7280]">
                Course Code: {course.course_code} • {course.modules_count} Modules • {course.lessons_count}{" "}
                Lessons
              </p>
              <Link
                href={`/courses/${course.slug}/lessons`}
                className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-[#0057FF] hover:underline"
              >
                View Course Overview
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Upload zone */}
          <div
            className={`ed-card flex flex-col items-center justify-center border-2 border-dashed p-10 transition-colors ${
              dragging ? "border-[#0057FF] bg-[#EBF2FF]/40" : uploadError ? "border-[#FCA5A5] bg-[#FEF2F2]/30" : "border-[#0057FF]"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!uploading) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (uploading) return;
              const file = e.dataTransfer.files[0];
              if (file) void processVideoFile(file);
            }}
          >
            {uploading ? (
              <>
                <Loader2 className="h-14 w-14 animate-spin text-[#0057FF]" strokeWidth={1.25} />
                <p className="mt-4 text-[15px] font-semibold text-[#002B7F]">Uploading your video</p>
              </>
            ) : (
              <>
                <CloudUpload className="h-14 w-14 text-[#0057FF]" strokeWidth={1.25} />
                <p className="mt-4 text-[15px] font-medium text-[#002B7F]">
                  Drag & drop your video file here or
                </p>
              </>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => videoRef.current?.click()}
                className="ed-btn-primary text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Browse Video Files
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => setLibraryOpen(true)}
                className="ed-btn-outline text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Upload from Library
              </button>
            </div>
            <input
              ref={videoRef}
              type="file"
              accept=".mp4,.mov,.avi,.webm,video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void processVideoFile(file);
              }}
            />
            <p className="mt-4 text-[12px] text-[#6B7280]">
              Accepted formats: MP4, MOV, AVI • Max file size: 5GB
            </p>

            <UploadProgressBlock
              fileName={form.videoFileName}
              progress={uploadProgress}
              loaded={uploadLoaded}
              total={uploadTotal}
              uploading={uploading}
              error={uploadError}
              onRetry={() => {
                setUploadError(null);
                resetVideoInput();
                videoRef.current?.click();
              }}
            />
          </div>

          {/* Video information */}
          <div className="ed-card p-5">
            <h2 className="mb-4 text-[15px] font-semibold text-[#002B7F]">Video Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">
                  Lesson Title <span className="text-[#EF4444]">*</span>
                </label>
                <input className="ed-input w-full" value={form.lessonTitle} onChange={(e) => patch({ lessonTitle: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">
                  Module / Section <span className="text-[#EF4444]">*</span>
                </label>
                <select className="ed-input w-full" value={form.module} onChange={(e) => patch({ module: e.target.value })}>
                  {MODULES.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">
                  Video Title <span className="text-[#EF4444]">*</span>
                </label>
                <input className="ed-input w-full" value={form.videoTitle} onChange={(e) => patch({ videoTitle: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">
                  Lesson Number <span className="text-[#EF4444]">*</span>
                </label>
                <input className="ed-input w-full" value={form.lessonNumber} onChange={(e) => patch({ lessonNumber: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">
                  Duration (HH:MM:SS) <span className="text-[#EF4444]">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input className="ed-input w-full pl-9" value={form.duration} onChange={(e) => patch({ duration: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">Instructor</label>
                <select className="ed-input w-full" value={form.instructor} onChange={(e) => patch({ instructor: e.target.value })}>
                  {INSTRUCTORS.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">Access Type</label>
                <select className="ed-input w-full" value={form.accessType} onChange={(e) => patch({ accessType: e.target.value })}>
                  {ACCESS_TYPES.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">Publish Status</label>
                <select className="ed-input w-full" value={form.publishStatus} onChange={(e) => patch({ publishStatus: e.target.value })}>
                  {PUBLISH_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">Tags</label>
                <div className="flex flex-wrap gap-2 rounded-[10px] border border-[#E5EAF2] p-2">
                  {form.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 rounded-md bg-[#EBF2FF] px-2 py-1 text-[12px] text-[#0057FF]">
                      {tag}
                      <button type="button" onClick={() => patch({ tags: form.tags.filter((t) => t !== tag) })}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    className="min-w-[120px] flex-1 border-0 bg-transparent text-[13px] outline-none"
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">
                  Lesson Description <span className="text-[#EF4444]">*</span>
                </label>
                <RichTextEditor value={form.description} onChange={(html) => patch({ description: html })} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[12px] font-semibold text-[#002B7F]">
                  Video Thumbnail / Banner <span className="text-[#EF4444]">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-4 rounded-[10px] border border-[#E5EAF2] p-4">
                  <div className="h-20 w-36 overflow-hidden rounded-lg bg-[#E5EAF2]">
                    {form.thumbnailPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.thumbnailPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[11px] text-[#9CA3AF]">16:9 preview</div>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      disabled={thumbnailUploading}
                      onClick={() => thumbRef.current?.click()}
                      className="ed-btn-outline text-[13px] disabled:opacity-60"
                    >
                      {thumbnailUploading ? "Uploading..." : "Upload Thumbnail"}
                    </button>
                    <p className="mt-1 text-[11px] text-[#9CA3AF]">Recommended: 1280×720px (16:9)</p>
                    {thumbnailError ? (
                      <p className="mt-1 text-[11px] font-medium text-[#DC2626]">{thumbnailError}</p>
                    ) : null}
                    <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleThumbnail(f); e.target.value = ""; }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Supplementary resources */}
          <div className="ed-card p-5">
            <h2 className="mb-4 text-[15px] font-semibold text-[#002B7F]">
              Supplementary Resources <span className="font-normal text-[#9CA3AF]">(Optional)</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { ref: slidesRef, type: "slides" as const, title: "Upload PDF Slides", note: "PDF up to 50MB", accept: ".pdf" },
                { ref: notesRef, type: "notes" as const, title: "Upload Notes / Handouts", note: "PDF, DOCX up to 50MB", accept: ".pdf,.doc,.docx" },
                { ref: otherRef, type: "other" as const, title: "Upload Other Files", note: "Any file up to 50MB", accept: "*/*" },
              ].map(({ ref, type, title, note, accept }) => (
                <div key={type} className="rounded-[10px] border border-dashed border-[#E5EAF2] p-4 text-center">
                  <FileText className="mx-auto h-8 w-8 text-[#0057FF]" />
                  <p className="mt-2 text-[13px] font-medium text-[#002B7F]">{title}</p>
                  <p className="text-[11px] text-[#9CA3AF]">{note}</p>
                  <button type="button" onClick={() => ref.current?.click()} className="ed-btn-outline mt-3 w-full text-[12px]">
                    <Upload className="mr-1 inline h-3.5 w-3.5" />
                    Choose File
                  </button>
                  <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadSupplementary(type, f); e.target.value = ""; }} />
                </div>
              ))}
            </div>
            {supplementaryUpload ? (
              <div className="mt-4 rounded-[10px] border border-[#E5EAF2] bg-[#F7F9FC] p-4">
                <div className="mb-2 flex items-center justify-between gap-2 text-[12px]">
                  <span className="truncate font-medium text-[#374151]">Uploading {supplementaryUpload.label}</span>
                  <span className="font-semibold text-[#0057FF]">{supplementaryUpload.progress}%</span>
                </div>
                <ProgressBar value={supplementaryUpload.progress} height={8} />
              </div>
            ) : null}
            {form.supplementary.length > 0 && (
              <ul className="mt-3 space-y-1 text-[12px] text-[#374151]">
                {form.supplementary.map((f) => (
                  <li key={f.id} className="flex items-center gap-2">
                    <Paperclip className="h-3.5 w-3.5 text-[#0057FF]" />
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Scheduling */}
          <div className="ed-card p-5">
            <h2 className="mb-4 text-[15px] font-semibold text-[#002B7F]">Scheduling & Publication</h2>
            <div className="space-y-3">
              {(
                [
                  { mode: "draft" as PublishMode, title: "Save as Draft", desc: "Save and continue later" },
                  { mode: "publish_now" as PublishMode, title: "Publish Now", desc: "Make available immediately" },
                  { mode: "schedule" as PublishMode, title: "Schedule Release Date", desc: "Set future publication date" },
                  { mode: "preview" as PublishMode, title: "Preview Lesson", desc: "Preview before publishing" },
                ] as const
              ).map(({ mode, title, desc }) => (
                <label
                  key={mode}
                  className={`flex cursor-pointer items-start gap-3 rounded-[10px] border p-3 ${form.publishMode === mode ? "border-[#0057FF] bg-[#EBF2FF]/40" : "border-[#E5EAF2]"}`}
                >
                  <input
                    type="radio"
                    name="publishMode"
                    checked={form.publishMode === mode}
                    onChange={() => {
                      patch({ publishMode: mode });
                      if (mode === "preview") setPreviewOpen(true);
                    }}
                    className="mt-1 accent-[#0057FF]"
                  />
                  <div>
                    <p className="text-[13px] font-semibold text-[#002B7F]">{title}</p>
                    <p className="text-[12px] text-[#6B7280]">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {form.publishMode === "schedule" && (
              <input
                type="datetime-local"
                className="ed-input mt-3 w-full max-w-xs"
                value={form.scheduledDate}
                onChange={(e) => patch({ scheduledDate: e.target.value })}
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleSaveDraft} className="ed-btn-outline gap-2 text-[13px]">
              <Save className="h-4 w-4" />
              Save Draft
            </button>
            <button type="button" onClick={() => setPreviewOpen(true)} className="ed-btn-outline gap-2 text-[13px]">
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              type="button"
              disabled={saving || uploading}
              onClick={() => void handleSubmit(true)}
              className="ed-btn-primary gap-2 text-[13px] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Send className="h-4 w-4" />
              {saving ? "Publishing..." : "Publish Video"}
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <RightPanel title="Course Preview">
            <div className="h-20 overflow-hidden rounded-lg bg-[#EBF2FF]">
              {course.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <p className="mt-2 text-[13px] font-semibold text-[#002B7F]">{course.title}</p>
            <p className="mt-1 text-[11px] text-[#6B7280]">
              {course.modules_count} Modules • {course.lessons_count} Lessons • {course.duration_label}
            </p>
            <Link href={`/courses/${course.slug}/lessons`} className="mt-2 inline-block text-[12px] font-medium text-[#0057FF] hover:underline">
              View Course →
            </Link>
          </RightPanel>

          <RightPanel title="Upload Progress">
            {form.videoFileName || uploading || uploadError ? (
              <UploadProgressBlock
                fileName={form.videoFileName}
                progress={uploadProgress}
                loaded={uploadLoaded}
                total={uploadTotal}
                uploading={uploading}
                error={uploadError}
                onRetry={() => {
                  setUploadError(null);
                  resetVideoInput();
                  videoRef.current?.click();
                }}
              />
            ) : (
              <p className="text-[12px] text-[#6B7280]">No video selected yet.</p>
            )}
          </RightPanel>

          {videoMeta && (
            <RightPanel title="Video Details">
              <dl className="space-y-1.5 text-[12px]">
                {[
                  ["Format", videoMeta.format],
                  ["Resolution", videoMeta.resolution],
                  ["Duration", videoMeta.duration],
                  ["File Size", videoMeta.fileSize],
                  ["Bitrate", videoMeta.bitrate],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-[#6B7280]">{k}</dt>
                    <dd className="font-medium text-[#374151]">{v}</dd>
                  </div>
                ))}
              </dl>
            </RightPanel>
          )}

          <RightPanel title="Upload Checklist">
            <ul className="space-y-2">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-[12px]">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22C55E]" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-[#D1D5DB]" />
                  )}
                  <span className={item.done ? "text-[#374151]" : "text-[#6B7280]"}>{item.label}</span>
                </li>
              ))}
            </ul>
          </RightPanel>

          <div className="ed-card flex gap-3 p-4">
            <Lightbulb className="h-5 w-5 shrink-0 text-[#F59E0B]" />
            <div>
              <p className="text-[13px] font-semibold text-[#002B7F]">Tips</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#6B7280]">
                Use 1080p resolution for best quality. Follow our content guidelines for naming and structure.
              </p>
              <Link href="/support" className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#0057FF] hover:underline">
                View Content Guidelines
                <FolderOpen className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <LibraryModal open={libraryOpen} items={library} onClose={() => setLibraryOpen(false)} onSelect={selectLibraryVideo} />
      <PreviewModal open={previewOpen} form={form} course={course} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
