export type LessonDraft = {
  id: string;
  title: string;
  type: "video" | "pdf" | "pptx";
  durationMinutes: number;
  contentUrl?: string;
  contentFileName?: string;
};

export type ModuleDraft = {
  id: string;
  title: string;
  lessons: LessonDraft[];
};

export type ObjectiveDraft = {
  id: string;
  text: string;
};

export type CourseFormState = {
  title: string;
  courseCode: string;
  category: string;
  instructor: string;
  difficulty: string;
  duration: string;
  price: string;
  isActive: boolean;
  shortDescription: string;
  fullDescription: string;
  thumbnailUrl: string;
  thumbnailPreview: string;
  bannerUrl: string;
  bannerPreview: string;
  objectives: ObjectiveDraft[];
  modules: ModuleDraft[];
  visibility: string;
};

export const COURSE_CATEGORIES = [
  "Nursing",
  "Pharmacology",
  "Anatomy & Physiology",
  "Mental Health",
  "Public Health",
  "Advanced Practice",
];

export const INSTRUCTORS = [
  "Dr. Sarah Johnson",
  "Prof. Michael Chen",
  "Dr. Amina Hassan",
  "Dr. James Wilson",
];

export const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

export const DRAFT_STORAGE_KEY = "edamad-course-draft";

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultCourseForm(): CourseFormState {
  return {
    title: "Adult Medical-Surgical Nursing",
    courseCode: "AMSN-101",
    category: "Nursing",
    instructor: "Dr. Sarah Johnson",
    difficulty: "Intermediate",
    duration: "20 hours",
    price: "79.99",
    isActive: true,
    shortDescription: "",
    fullDescription: "",
    thumbnailUrl: "",
    thumbnailPreview: "",
    bannerUrl: "",
    bannerPreview: "",
    objectives: [
      {
        id: uid("obj"),
        text: "Apply evidence-based nursing interventions for adult medical-surgical patients.",
      },
      {
        id: uid("obj"),
        text: "Assess and manage common medical and surgical conditions across the lifespan.",
      },
    ],
    modules: [
      {
        id: uid("mod"),
        title: "Module 1: Foundations of Medical-Surgical Nursing",
        lessons: [
          {
            id: uid("les"),
            title: "Introduction to Medical-Surgical Nursing",
            type: "video",
            durationMinutes: 30,
          },
          {
            id: uid("les"),
            title: "The Nursing Process in Adult Care",
            type: "video",
            durationMinutes: 25,
          },
        ],
      },
    ],
    visibility: "public",
  };
}

export function loadCourseDraft(): CourseFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CourseFormState;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveCourseDraft(form: CourseFormState) {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
}

export function clearCourseDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export function moduleDurationLabel(lessons: LessonDraft[]) {
  const totalMinutes = lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  optional?: boolean;
};

export function buildChecklist(form: CourseFormState): ChecklistItem[] {
  const hasLessons = form.modules.some((m) => m.lessons.length > 0);
  return [
    {
      id: "basic",
      label: "Basic Information",
      done: Boolean(form.title && form.courseCode && form.category && form.instructor),
    },
    {
      id: "desc",
      label: "Description",
      done: Boolean(form.shortDescription.trim() && form.fullDescription.trim()),
    },
    {
      id: "objectives",
      label: "Objectives",
      done: form.objectives.some((o) => o.text.trim()),
    },
    {
      id: "modules",
      label: "Modules & Lessons",
      done: form.modules.length > 0 && hasLessons,
    },
    {
      id: "thumbnail",
      label: "Thumbnail",
      done: Boolean(form.thumbnailUrl || form.thumbnailPreview),
    },
    {
      id: "pricing",
      label: "Pricing",
      done: Boolean(form.price && Number(form.price) >= 0),
    },
    {
      id: "banner",
      label: "Course Banner",
      done: Boolean(form.bannerUrl || form.bannerPreview),
      optional: true,
    },
    {
      id: "publish",
      label: "Publish Settings",
      done: form.isActive,
      optional: true,
    },
  ];
}

export function checklistProgress(items: ChecklistItem[]) {
  const required = items.filter((i) => !i.optional);
  const done = required.filter((i) => i.done).length;
  return Math.round((done / required.length) * 100);
}

export function formToPayload(form: CourseFormState, publish: boolean) {
  let sortOrder = 0;
  const lessons = form.modules.flatMap((mod, modIndex) =>
    mod.lessons.map((lesson) => ({
      title: lesson.title,
      module_title: mod.title,
      module_sort_order: modIndex,
      lesson_type: lesson.type,
      duration_seconds: (lesson.durationMinutes || 0) * 60,
      content_url: lesson.contentUrl ?? null,
      sort_order: sortOrder++,
    })),
  );

  return {
    title: form.title,
    course_code: form.courseCode,
    category: form.category,
    instructor: form.instructor,
    difficulty: form.difficulty,
    duration_label: form.duration,
    short_description: form.shortDescription,
    full_description: form.fullDescription,
    description: form.shortDescription,
    price: Number(form.price) || 0,
    thumbnail_url: form.thumbnailUrl || null,
    banner_url: form.bannerUrl || null,
    learning_objectives: form.objectives.map((o) => o.text).filter(Boolean),
    is_published: publish,
    is_active: form.isActive,
    visibility: form.visibility,
    lessons,
  };
}
