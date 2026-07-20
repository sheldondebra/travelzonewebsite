export type PublishMode = "draft" | "publish_now" | "schedule" | "preview";

export type SupplementaryFile = {
  id: string;
  type: "slides" | "notes" | "other";
  name: string;
  url?: string;
};

export type VideoMetadata = {
  format: string;
  resolution: string;
  duration: string;
  fileSize: string;
  bitrate: string;
};

export type LibraryVideo = {
  id: string;
  name: string;
  size: string;
  duration: string;
  url?: string;
};

export type VideoUploadForm = {
  courseId: number | null;
  lessonTitle: string;
  module: string;
  videoTitle: string;
  lessonNumber: string;
  duration: string;
  instructor: string;
  accessType: string;
  publishStatus: string;
  tags: string[];
  description: string;
  thumbnailPreview: string;
  thumbnailUrl: string;
  videoFile: File | null;
  videoUrl: string;
  videoFileName: string;
  supplementary: SupplementaryFile[];
  publishMode: PublishMode;
  scheduledDate: string;
};

export const VIDEO_UPLOAD_DRAFT_KEY = "edamad-video-upload-draft";
export const VIDEO_LIBRARY_KEY = "edamad-video-library";

export const MODULES = [
  "Module 1: Foundations of Medical-Surgical Nursing",
  "Module 2: Cardiovascular & Respiratory Disorders",
  "Module 3: Fluid, Electrolyte, and Acid-Base Balance",
  "Module 4: Endocrine & Metabolic Disorders",
  "Module 5: Gastrointestinal & Genitourinary Care",
  "Module 6: Musculoskeletal & Integumentary Nursing",
  "Module 7: Perioperative Nursing",
  "Module 8: Emergency & Critical Care Nursing",
];

export const INSTRUCTORS = [
  "Dr. Sarah Johnson, MSN, RN",
  "Prof. Michael Chen, PhD, RN",
  "Dr. Amina Hassan, DNP, RN",
];

export const ACCESS_TYPES = ["Free", "Premium", "Enrolled Only"];
export const PUBLISH_STATUSES = ["Draft", "Published", "Scheduled"];

export const DEFAULT_COURSE = {
  id: 0,
  title: "Adult Medical-Surgical Nursing",
  course_code: "AMSN-101",
  slug: "adult-medical-surgical-nursing",
  is_active: true,
  modules_count: 8,
  lessons_count: 68,
  duration_label: "12h 45m",
  thumbnail_url: "",
};

export function defaultVideoForm(): VideoUploadForm {
  return {
    courseId: null,
    lessonTitle: "Fluid and Electrolyte Imbalances",
    module: MODULES[2],
    videoTitle: "Fluid and Electrolyte Imbalances — Overview and Nursing Care",
    lessonNumber: "3.2",
    duration: "00:18:45",
    instructor: INSTRUCTORS[0],
    accessType: "Premium",
    publishStatus: "Draft",
    tags: ["Fluid Balance", "Electrolytes", "Medical-Surgical Nursing"],
    description:
      "<p>This lesson covers the pathophysiology of fluid and electrolyte imbalances, clinical assessment findings, and evidence-based nursing interventions for restoring balance in adult medical-surgical patients.</p>",
    thumbnailPreview: "",
    thumbnailUrl: "",
    videoFile: null,
    videoUrl: "",
    videoFileName: "",
    supplementary: [],
    publishMode: "draft",
    scheduledDate: "",
  };
}

export function loadVideoDraft(): VideoUploadForm | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VIDEO_UPLOAD_DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VideoUploadForm;
      return { ...parsed, videoFile: null };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveVideoDraft(form: VideoUploadForm) {
  const { videoFile: _, ...rest } = form;
  localStorage.setItem(VIDEO_UPLOAD_DRAFT_KEY, JSON.stringify(rest));
}

export function loadVideoLibrary(): LibraryVideo[] {
  if (typeof window === "undefined") return defaultLibrary();
  try {
    const raw = localStorage.getItem(VIDEO_LIBRARY_KEY);
    if (raw) return JSON.parse(raw) as LibraryVideo[];
  } catch {
    /* ignore */
  }
  return defaultLibrary();
}

export function saveVideoLibrary(items: LibraryVideo[]) {
  localStorage.setItem(VIDEO_LIBRARY_KEY, JSON.stringify(items));
}

function defaultLibrary(): LibraryVideo[] {
  return [
    {
      id: "lib-1",
      name: "Introduction_to_MedSurg_Nursing.mp4",
      size: "1.2 GB",
      duration: "00:22:10",
    },
    {
      id: "lib-2",
      name: "Cardiac_Assessment_Basics.mp4",
      size: "890 MB",
      duration: "00:15:30",
    },
    {
      id: "lib-3",
      name: "Fluid_Electrolyte_Imbalances.mp4",
      size: "2.8 GB",
      duration: "00:18:45",
    },
  ];
}

export function parseDurationToSeconds(duration: string): number {
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

export type UploadChecklistItem = { id: string; label: string; done: boolean; optional?: boolean };

export function buildUploadChecklist(form: VideoUploadForm, uploadComplete: boolean): UploadChecklistItem[] {
  return [
    { id: "video", label: "Video file uploaded", done: uploadComplete || Boolean(form.videoUrl) },
    {
      id: "info",
      label: "Video information added",
      done: Boolean(form.lessonTitle && form.videoTitle && form.module),
    },
    { id: "thumb", label: "Thumbnail added", done: Boolean(form.thumbnailUrl || form.thumbnailPreview) },
    { id: "desc", label: "Lesson description added", done: Boolean(form.description.replace(/<[^>]+>/g, "").trim()) },
    {
      id: "supp",
      label: "Supplementary resources (optional)",
      done: form.supplementary.length > 0,
      optional: true,
    },
    {
      id: "pub",
      label: "Published / Scheduled",
      done: form.publishMode === "publish_now" || (form.publishMode === "schedule" && Boolean(form.scheduledDate)),
    },
  ];
}

export function durationFromVideoFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const total = Math.floor(video.duration);
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      URL.revokeObjectURL(video.src);
      resolve(
        [h, m, s].map((n) => String(n).padStart(2, "0")).join(":"),
      );
    };
    video.onerror = () => resolve("00:00:00");
    video.src = URL.createObjectURL(file);
  });
}
