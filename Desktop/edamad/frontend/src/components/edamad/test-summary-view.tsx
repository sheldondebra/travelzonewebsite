"use client";

import Link from "next/link";
import { Award, CheckCircle, Clock, GraduationCap, HelpCircle, XCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/edamad/breadcrumbs";
import { ProgressBar } from "@/components/edamad/progress-bar";
import { RightPanel } from "@/components/edamad/right-panel";
import { StatCard } from "@/components/edamad/stat-card";
import { formatElapsed, usePracticeAttemptStore } from "@/store/practice-attempt-store";
import type { PracticeTestDetail } from "@/types/practice";

export function TestSummaryView({
  data,
  subjectSlug,
}: {
  data: PracticeTestDetail;
  subjectSlug: string;
}) {
  const { test, course } = data;
  const { result, setReviewIncorrectOnly } = usePracticeAttemptStore();

  if (!result) {
    return (
      <div className="text-center">
        <p className="text-[#6B7280]">No test results found.</p>
        <Link href={`/practice/${subjectSlug}/test/${test.slug}`} className="ed-btn-primary mt-4 inline-flex">
          Take Test
        </Link>
      </div>
    );
  }

  const passed = result.passed;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Practice", href: "/practice" },
          { label: course.title, href: `/practice/${subjectSlug}` },
          { label: test.title, href: `/practice/${subjectSlug}/test/${test.slug}` },
          { label: "Test Summary" },
        ]}
      />

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DCFCE7]">
          <CheckCircle className="h-8 w-8 text-[#22C55E]" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">Test Completed!</h1>
          <p className="text-[13px] text-[#6B7280]">
            Great job! You have completed the {test.title}.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={CheckCircle} label="Total Questions" value={result.total_questions} iconColor="#0057FF" />
        <StatCard icon={CheckCircle} label="Correct Answers" value={result.correct} iconColor="#22C55E" />
        <StatCard icon={XCircle} label="Incorrect Answers" value={result.incorrect} iconColor="#EF4444" />
        <StatCard icon={HelpCircle} label="Unanswered" value={result.unanswered} iconColor="#6B7280" />
        <StatCard icon={Clock} label="Time Taken" value={formatElapsed(result.time_taken_seconds)} iconColor="#F59E0B" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="ed-card flex flex-wrap items-center gap-6 p-6">
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#E5EAF2" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#0057FF"
                  strokeWidth="8"
                  strokeDasharray={`${result.score_pct * 2.64} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-2xl font-bold text-[#002B7F]">{result.score_pct}%</span>
                <p className="text-[11px] text-[#6B7280]">Your Score</p>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-[#002B7F]">
                {passed ? "Excellent Performance!" : "Keep Practicing!"}
              </h2>
              <p className="mt-1 text-[13px] text-[#6B7280]">
                {passed
                  ? "You have passed the test. Keep up the great work!"
                  : `You need ${test.passing_score}% to pass. Review incorrect answers and try again.`}
              </p>
              <span
                className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-medium ${
                  passed ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#FEE2E2] text-[#991B1B]"
                }`}
              >
                <Award className="h-4 w-4" /> {passed ? "PASSED" : "NOT PASSED"}
              </span>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/practice/${subjectSlug}/test/${test.slug}/review`}
                  className="ed-btn-outline"
                  onClick={() => setReviewIncorrectOnly(false)}
                >
                  View Performance Breakdown
                </Link>
                <Link
                  href={`/practice/${subjectSlug}/test/${test.slug}/review`}
                  className="ed-btn-primary"
                  onClick={() => setReviewIncorrectOnly(true)}
                >
                  Review Incorrect Answers
                </Link>
              </div>
            </div>
          </div>

          <div className="ed-card flex flex-wrap items-center justify-between gap-4 bg-[#EBF2FF] p-5">
            <div className="flex items-start gap-3">
              <GraduationCap className="mt-0.5 h-6 w-6 shrink-0 text-[#0057FF]" />
              <div>
                <p className="font-semibold text-[#002B7F]">What&apos;s Next?</p>
                <p className="text-[13px] text-[#6B7280]">
                  Keep up the great work! Continue practicing to master all topics and boost your confidence.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/practice/${subjectSlug}`} className="ed-btn-outline">
                Back to Practice
              </Link>
              <Link href={`/practice/${subjectSlug}`} className="ed-btn-primary">
                Choose Another Test
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <RightPanel title="Test Overview">
            <ul className="space-y-2 text-[13px]">
              <li className="flex justify-between">
                <span className="text-[#6B7280]">Course</span>
                <span className="font-medium text-[#002B7F]">{course.title}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-[#6B7280]">Test Name</span>
                <span className="max-w-[140px] truncate text-right font-medium text-[#002B7F]">{test.title}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-[#6B7280]">Total Questions</span>
                <span className="font-medium text-[#002B7F]">{result.total_questions}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-[#6B7280]">Passing Score</span>
                <span className="font-medium text-[#002B7F]">{test.passing_score}%</span>
              </li>
              <li className="flex justify-between">
                <span className="text-[#6B7280]">Your Score</span>
                <span className={`font-semibold ${passed ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                  {result.score_pct}% ({result.correct}/{result.total_questions})
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-[#6B7280]">Result</span>
                <span className={`font-semibold ${passed ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                  {passed ? "Passed" : "Failed"}
                </span>
              </li>
            </ul>
          </RightPanel>

          {result.section_performance.length > 0 && (
            <RightPanel title="Section Performance">
              {result.section_performance.map((section) => (
                <div key={section.name} className="mb-3 last:mb-0">
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span className="text-[#374151]">{section.name}</span>
                    <span className="font-medium text-[#0057FF]">
                      {section.correct}/{section.total} ({section.score_pct}%)
                    </span>
                  </div>
                  <ProgressBar value={section.score_pct} height={6} />
                </div>
              ))}
            </RightPanel>
          )}
        </div>
      </div>
    </div>
  );
}
