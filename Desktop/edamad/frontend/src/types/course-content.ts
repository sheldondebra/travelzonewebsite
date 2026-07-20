export interface CourseContentLesson {
  id: number;
  title: string;
  description: string | null;
  duration_seconds: number;
  sort_order: number;
  is_completed: boolean;
  watch_seconds: number;
  is_active: boolean;
}

export interface CourseContentResponse {
  course: {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    icon: string;
    icon_bg: string;
    outline_url: string | null;
  };
  progress_percent: number;
  total_lessons: number;
  current_lesson: {
    id: number;
    title: string;
    description: string | null;
    duration_seconds: number;
    sort_order: number;
    is_completed: boolean;
    watch_seconds: number;
    video_url: string | null;
    lesson_thumbnail_url: string | null;
    supplementary_files?: {
      id: string;
      type: string;
      name: string;
      url?: string;
    }[];
  } | null;
  lessons: CourseContentLesson[];
  prev_lesson_order: number | null;
  next_lesson_order: number | null;
}
