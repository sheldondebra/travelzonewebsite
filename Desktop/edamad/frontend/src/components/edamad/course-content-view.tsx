"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Download,
  Lightbulb,
  Play,
  BarChart3,
  BookOpen,
} from "lucide-react";
import { Breadcrumbs } from "@/components/edamad/breadcrumbs";
import { LessonVideoPlayer } from "@/components/edamad/lesson-video-player";
import { ProgressBar } from "@/components/edamad/progress-bar";
import { RightPanel } from "@/components/edamad/right-panel";
import { getCourseContentTheme } from "@/lib/course-content-themes";
import { getStoreCourseIcon } from "@/lib/store-utils";
import { fetchCourseContent } from "@/services/courses";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDurationLabel(seconds: number): string {
  return `${formatDuration(seconds)} min`;
}

export function CourseContentView({
  courseSlug,
  lessonOrder,
}: {
  courseSlug: string;
  lessonOrder: number;
}) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(false);
  const theme = getCourseContentTheme(courseSlug);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["course-content", courseSlug, lessonOrder],
    queryFn: () => fetchCourseContent(courseSlug, lessonOrder),
  });

  if (isLoading) {
    return <p className="py-12 text-center text-[#6B7280]">Loading course content...</p>;
  }

  if (isError || !data?.current_lesson) {
    return <p className="py-12 text-center text-[#EF4444]">Could not load course content.</p>;
  }

  const { course, current_lesson, lessons, progress_percent, total_lessons, prev_lesson_order, next_lesson_order } =
    data;
  const CourseIcon = getStoreCourseIcon(course.icon);

  function goToLesson(order: number) {
    router.push(`/courses/${courseSlug}/lessons/${order}`);
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "My Courses", href: "/dashboard" },
          { label: course.title, href: `/courses/${courseSlug}/lessons/1` },
          { label: "Course Content" },
        ]}
        action={
          <button
            type="button"
            onClick={() => setBookmarked((b) => !b)}
            className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors ${
              bookmarked ? "text-[#002B7F]" : "text-[#0057FF] hover:text-[#0046CC]"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-[#0057FF] text-[#0057FF]" : ""}`} />
            Bookmark This Lesson
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <div className="ed-card p-5">
            <div className="flex gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: course.icon_bg }}
              >
                <CourseIcon className="h-7 w-7" style={{ color: theme.iconColor }} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-[20px] font-bold text-[#002B7F]">{course.title}</h1>
                <p className="mt-1 text-[13px] leading-relaxed text-[#6B7280]">{course.description}</p>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-[12px]">
                    <span className="text-[#6B7280]">Overall Course Progress</span>
                    <span className="font-semibold text-[#0057FF]">{progress_percent}% Complete</span>
                  </div>
                  <ProgressBar value={progress_percent} height={6} color={theme.progressColor} />
                </div>
              </div>
            </div>
          </div>

          <LessonVideoPlayer
            videoUrl={current_lesson.video_url}
            posterUrl={current_lesson.lesson_thumbnail_url}
            initialSeconds={current_lesson.watch_seconds}
            durationSeconds={current_lesson.duration_seconds}
          />

          <div>
            <h2 className="text-[17px] font-bold text-[#002B7F]">
              {current_lesson.sort_order}. {current_lesson.title}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6B7280]">
              {current_lesson.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                {formatDurationLabel(current_lesson.duration_seconds)}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
                Lesson {current_lesson.sort_order} of {total_lessons}
              </span>
              {current_lesson.is_completed && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#DCFCE7] px-2.5 py-1 text-[11px] font-semibold text-[#166534]">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Completed
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!prev_lesson_order}
              onClick={() => prev_lesson_order && goToLesson(prev_lesson_order)}
              className="ed-btn-outline gap-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Lesson
            </button>
            <button
              type="button"
              disabled={!next_lesson_order}
              onClick={() => next_lesson_order && goToLesson(next_lesson_order)}
              className="ed-btn-primary gap-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next Lesson
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div
            className={`ed-card flex flex-wrap items-center justify-between gap-4 p-4 ${theme.tipCardClass ?? "bg-[#EBF2FF]"}`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#0057FF]" strokeWidth={1.75} />
              <p className="text-[13px] leading-relaxed text-[#374151]">
                <strong className="font-semibold text-[#002B7F]">Did You Know?</strong> {theme.tip}
              </p>
            </div>
            <Link href="/progress" className="ed-btn-outline shrink-0 gap-2 text-[13px]">
              <BarChart3 className="h-4 w-4" />
              View Course Progress
            </Link>
          </div>
        </div>

        <RightPanel
          title="Course Content"
          action={
            <span className="text-[12px] font-medium text-[#6B7280]">{total_lessons} Lessons</span>
          }
        >
          <ul className="max-h-[480px] space-y-1 overflow-y-auto pr-1">
            {lessons.map((lesson) => {
              const isActive = lesson.is_active;
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => goToLesson(lesson.sort_order)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors ${
                      isActive ? theme.activeLessonClass : "text-[#374151] hover:bg-[#F7F9FC]"
                    }`}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      {isActive ? (
                        <Play className={`h-3.5 w-3.5 ${theme.activePlayIconClass}`} />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate leading-snug">
                      {lesson.sort_order}. {lesson.title}
                    </span>
                    <span
                      className={`shrink-0 text-[11px] tabular-nums ${
                        isActive ? theme.activeLessonDurationClass : "text-[#9CA3AF]"
                      }`}
                    >
                      {formatDuration(lesson.duration_seconds)}
                    </span>
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      {lesson.is_completed ? (
                        <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                      ) : (
                        <Circle className="h-4 w-4 text-[#D1D5DB]" strokeWidth={1.5} />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {course.outline_url && (
            <a
              href={course.outline_url}
              className="ed-btn-outline mt-4 flex w-full items-center justify-center gap-2 text-[13px]"
            >
              <Download className="h-4 w-4" />
              Download Course Outline
            </a>
          )}
        </RightPanel>
      </div>
    </div>
  );
}
