"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, LineChart, Trophy } from "lucide-react";
import { MyCourseCard } from "@/components/edamad/my-course-card";
import { getCourseContentTheme } from "@/lib/course-content-themes";
import { getStoreCourseIcon } from "@/lib/store-utils";
import { fetchMyCourses } from "@/services/my-courses";

export function MyCoursesGrid() {
  const { data: courses = [], isLoading, isError } = useQuery({
    queryKey: ["my-courses"],
    queryFn: fetchMyCourses,
  });

  const continueSlug = courses[0]?.slug ?? "pharmacology";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">My Courses</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[#6B7280]">
            Thank you for your purchase! You now have access to the following courses.
          </p>
        </div>
        <Link
          href={`/courses/${continueSlug}/lessons/1`}
          className="ed-btn-primary shrink-0 gap-1 px-5"
        >
          Continue Learning
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-[#6B7280]">Loading your courses...</p>
      ) : isError ? (
        <p className="py-8 text-center text-[#EF4444]">Could not load your courses.</p>
      ) : courses.length === 0 ? (
        <div className="ed-card p-8 text-center">
          <p className="text-[15px] font-semibold text-[#002B7F]">No enrolled courses yet</p>
          <p className="mt-2 text-[13px] text-[#6B7280]">
            Browse the course store to purchase your first program.
          </p>
          <Link href="/courses/store" className="ed-btn-primary mt-4 inline-flex">
            Browse Course Store
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const theme = getCourseContentTheme(course.slug);
            const Icon = getStoreCourseIcon(course.icon);
            return (
              <MyCourseCard
                key={course.id}
                slug={course.slug}
                title={course.title}
                description={course.description ?? ""}
                lessons={course.lessons_count}
                progress={course.progress_percent}
                icon={Icon}
                iconBg={course.icon_bg}
                accent={theme.progressColor}
              />
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[12px] bg-[#EBF2FF] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0057FF] text-white">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#002B7F]">You&apos;re on your way!</p>
            <p className="text-[13px] text-[#6B7280]">
              Keep learning, keep practicing and achieve your goals.
            </p>
          </div>
        </div>
        <Link
          href="/progress"
          className="inline-flex h-[40px] items-center gap-2 rounded-[10px] border border-[#0057FF] bg-white px-4 text-[13px] font-semibold text-[#0057FF] hover:bg-[#F7F9FC]"
        >
          <LineChart className="h-4 w-4" />
          View Progress
        </Link>
      </div>
    </div>
  );
}
