import Link from "next/link";
import { ChevronRight, GraduationCap, type LucideIcon } from "lucide-react";
import { ProgressBar } from "@/components/edamad/progress-bar";

export function MyCourseCard({
  title,
  description,
  lessons,
  progress,
  slug,
  icon: Icon,
  iconBg,
  accent,
}: {
  title: string;
  description: string;
  lessons: number;
  progress: number;
  slug: string;
  icon: LucideIcon;
  iconBg: string;
  accent: string;
}) {
  return (
    <article className="ed-card flex h-full flex-col p-4">
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} strokeWidth={1.75} />
      </div>
      <h3 className="text-[15px] font-semibold text-[#002B7F]">{title}</h3>
      <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-[#6B7280] line-clamp-3">
        {description}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#6B7280]">
        <GraduationCap className="h-3.5 w-3.5" />
        {lessons} Lessons
      </p>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[11px]">
          <span className="text-[#6B7280]">Progress</span>
          <span className="font-semibold" style={{ color: accent }}>
            {progress}% Complete
          </span>
        </div>
        <ProgressBar value={progress} color={accent} height={6} />
      </div>
      <Link
        href={`/courses/${slug}/lessons/1`}
        className="ed-btn-ghost-navy mt-4 w-full gap-1"
      >
        Continue Learning
        <ChevronRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
