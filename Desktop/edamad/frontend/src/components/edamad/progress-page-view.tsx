import Link from "next/link";
import {
  Award,
  Baby,
  BookOpen,
  Brain,
  ChevronRight,
  CheckCircle2,
  Clock,
  Gauge,
  Heart,
  Stethoscope,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { ProgressBar } from "@/components/edamad/progress-bar";
import { progressCourses, progressSummary } from "@/lib/mock-data";

const courseIcons: Record<string, LucideIcon> = {
  heart: Heart,
  stethoscope: Stethoscope,
  baby: Baby,
  brain: Brain,
};

function ProgressStat({
  icon: Icon,
  label,
  value,
  iconColor = "#0057FF",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconColor?: string;
}) {
  return (
    <div className="flex min-w-[130px] items-center gap-2.5 rounded-[10px] border border-[#E5EAF2] bg-white px-3 py-2.5">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${iconColor}14`, color: iconColor }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-[18px] font-bold leading-none text-[#002B7F]">{value}</p>
        <p className="mt-0.5 text-[11px] leading-tight text-[#6B7280]">{label}</p>
      </div>
    </div>
  );
}

function ProgressCourseCard({
  slug,
  title,
  description,
  progress,
  lessonsDone,
  lessonsTotal,
  studyTime,
  lastAccessed,
  accent,
  iconBg,
  icon,
}: (typeof progressCourses)[number]) {
  const Icon = courseIcons[icon] ?? BookOpen;

  return (
    <article className="ed-card flex flex-wrap items-center gap-4 p-5">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-7 w-7" style={{ color: accent }} strokeWidth={1.5} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold text-[#002B7F]">{title}</h3>
        <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#6B7280]">{description}</p>

        <div className="mt-3 max-w-lg">
          <div className="mb-1 flex justify-end">
            <span className="text-[12px] font-semibold" style={{ color: accent }}>
              {progress}%
            </span>
          </div>
          <ProgressBar value={progress} color={accent} height={6} />
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-[#6B7280]">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
            {lessonsDone} / {lessonsTotal} Lessons Completed
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
            {studyTime} Study Time
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 sm:min-w-[150px]">
        <Link
          href={`/courses/${slug}/lessons/1`}
          className="inline-flex h-[38px] items-center gap-1 rounded-[10px] border px-4 text-[13px] font-semibold transition-colors hover:bg-[#F7F9FC]"
          style={{ borderColor: accent, color: accent }}
        >
          Continue Learning
          <ChevronRight className="h-4 w-4" />
        </Link>
        <p className="text-[11px] text-[#9CA3AF]">Last accessed: {lastAccessed}</p>
      </div>
    </article>
  );
}

export function ProgressPageView() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">My Progress</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Track your learning journey across all your courses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <ProgressStat icon={BookOpen} label="Courses Enrolled" value={progressSummary.coursesEnrolled} />
          <ProgressStat
            icon={Gauge}
            label="Average Progress"
            value={`${progressSummary.averageProgress}%`}
            iconColor="#F59E0B"
          />
          <ProgressStat
            icon={CheckCircle2}
            label="Lessons Completed"
            value={progressSummary.lessonsCompleted}
            iconColor="#22C55E"
          />
          <ProgressStat
            icon={Trophy}
            label="Certificates Earned"
            value={progressSummary.certificatesEarned}
            iconColor="#8B5CF6"
          />
        </div>
      </div>

      <div className="space-y-4">
        {progressCourses.map((course) => (
          <ProgressCourseCard key={course.slug} {...course} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[12px] bg-[#EBF2FF] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0057FF] text-white">
            <Trophy className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#002B7F]">Keep it up!</p>
            <p className="text-[13px] text-[#6B7280]">
              You&apos;re making great progress. Consistency today leads to excellence tomorrow.
            </p>
          </div>
        </div>
        <button type="button" className="ed-btn-outline shrink-0 gap-2 text-[13px]">
          <Award className="h-4 w-4" />
          View Achievements
        </button>
      </div>
    </div>
  );
}
