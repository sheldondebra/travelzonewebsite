"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, LineChart, Trophy } from "lucide-react";
import { toast } from "sonner";
import { AnnouncementsPanel } from "@/components/edamad/announcements-panel";
import { MyCourseCard } from "@/components/edamad/my-course-card";
import { getCourseAccent, getStoreCourseIcon } from "@/lib/store-utils";
import { fetchMyCourses } from "@/services/courses";

export function DashboardView() {
  const searchParams = useSearchParams();
  const justPurchased = searchParams.get("purchased") === "1";

  const { data: courses = [], isLoading, isError } = useQuery({
    queryKey: ["my-courses"],
    queryFn: fetchMyCourses,
  });

  const continueSlug = courses[0]?.slug ?? "pharmacology";

  useEffect(() => {
    if (justPurchased) {
      toast.success("Purchase complete! Check your email for course details.");
    }
  }, [justPurchased]);

  return (
    <div>
      {justPurchased && (
        <div className="mb-6 flex items-start gap-3 rounded-[12px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#22C55E]" />
          <div>
            <p className="text-[14px] font-semibold text-[#166534]">Payment successful</p>
            <p className="mt-0.5 text-[13px] text-[#15803D]">
              Your courses are unlocked. A confirmation email with your purchase details has been sent.
            </p>
          </div>
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">My Courses</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[#6B7280]">
            {justPurchased
              ? "Thank you for your purchase! You now have access to the following courses."
              : courses.length > 0
                ? "Continue learning from your enrolled courses."
                : "Browse the course store to start your learning journey."}
          </p>
        </div>
        {courses.length > 0 && (
          <Link
            href={`/courses/${continueSlug}/lessons/1`}
            className="ed-btn-primary shrink-0 gap-1 px-5"
          >
            Continue Learning
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="mb-6">
        <AnnouncementsPanel />
      </div>

      {isLoading ? (
        <p className="text-center text-[13px] text-[#6B7280]">Loading your courses...</p>
      ) : isError ? (
        <p className="text-center text-[13px] text-[#EF4444]">
          Could not load your courses. Make sure the backend is running.
        </p>
      ) : courses.length === 0 ? (
        <div className="ed-card py-12 text-center">
          <p className="text-[14px] text-[#6B7280]">You have not enrolled in any courses yet.</p>
          <Link href="/courses/store" className="ed-btn-primary mt-4 inline-flex">
            Browse Course Store
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <MyCourseCard
              key={course.slug}
              title={course.title}
              description={course.description ?? ""}
              lessons={course.lessons_count}
              progress={course.progress_percent}
              slug={course.slug}
              icon={getStoreCourseIcon(course.icon)}
              iconBg={course.icon_bg}
              accent={getCourseAccent(course.icon)}
            />
          ))}
        </div>
      )}

      {courses.length > 0 && (
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
      )}
    </div>
  );
}
