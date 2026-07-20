"use client";

import Link from "next/link";
import { ChevronRight, Crosshair } from "lucide-react";
import { ProgressBar } from "@/components/edamad/progress-bar";
import { getStoreCourseIcon } from "@/lib/store-utils";

export function PracticeSubjectCard({
  slug,
  title,
  description,
  icon,
  iconBg = "#EBF2FF",
  testsCount,
  totalQuestions,
  masteryPct,
}: {
  slug: string;
  title: string;
  description: string | null;
  icon: string;
  iconBg?: string;
  testsCount: number;
  totalQuestions: number;
  masteryPct: number;
}) {
  const Icon = getStoreCourseIcon(icon);

  return (
    <article className="ed-card flex h-full flex-col p-4">
      <div
        className="mb-3 flex h-14 w-14 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-8 w-8 text-[#0057FF]" strokeWidth={1.5} />
      </div>

      <h3 className="text-[14px] font-semibold leading-snug text-[#002B7F]">{title}</h3>
      <p className="mt-2 flex-1 text-[12px] leading-relaxed text-[#6B7280] line-clamp-2">
        {description ?? "Take timed practice tests and track your mastery."}
      </p>

      <p className="mt-3 text-[11px] text-[#6B7280]">
        {testsCount} tests · {totalQuestions} questions
      </p>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[11px]">
          <span className="text-[#6B7280]">Mastery</span>
          <span className="font-semibold text-[#0057FF]">{masteryPct}%</span>
        </div>
        <ProgressBar value={masteryPct} height={6} />
      </div>

      <Link
        href={`/practice/${slug}`}
        className="mt-3 flex h-[38px] w-full items-center justify-center gap-2 rounded-[10px] border border-[#002B7F] bg-white text-[13px] font-semibold text-[#002B7F] transition-colors hover:bg-[#F7F9FC]"
      >
        <Crosshair className="h-4 w-4" strokeWidth={2} />
        Start Practice
        <ChevronRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
