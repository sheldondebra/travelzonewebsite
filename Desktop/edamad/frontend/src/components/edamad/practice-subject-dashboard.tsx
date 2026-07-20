"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, Lightbulb, Play } from "lucide-react";
import { Breadcrumbs } from "@/components/edamad/breadcrumbs";
import { ProgressBar } from "@/components/edamad/progress-bar";
import { RightPanel } from "@/components/edamad/right-panel";
import { getPracticeTestIcon } from "@/lib/practice-utils";
import { getStoreCourseIcon } from "@/lib/store-utils";
import { fetchPracticeSubject } from "@/services/practice";
import { usePracticeAttemptStore } from "@/store/practice-attempt-store";

const TABS = ["Overview", "Practice Tests", "Question Bank", "Performance"] as const;
type Tab = (typeof TABS)[number];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PerformanceDonut({ mastery, correct, incorrect, unattempted }: {
  mastery: number;
  correct: number;
  incorrect: number;
  unattempted: number;
}) {
  const total = correct + incorrect + unattempted || 1;
  const correctPct = (correct / total) * 100;
  const incorrectPct = (incorrect / total) * 100;
  const circumference = 238.76;
  const correctDash = (correctPct / 100) * circumference;
  const incorrectDash = (incorrectPct / 100) * circumference;

  return (
    <div className="flex flex-wrap items-center gap-4 py-2">
      <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#E5EAF2" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="#22C55E"
            strokeWidth="10"
            strokeDasharray={`${correctDash} ${circumference}`}
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="#EF4444"
            strokeWidth="10"
            strokeDasharray={`${incorrectDash} ${circumference}`}
            strokeDashoffset={-correctDash}
            strokeLinecap="round"
          />
        </svg>
        <div className="text-center">
          <span className="text-xl font-bold text-[#002B7F]">{mastery}%</span>
          <p className="text-[10px] text-[#6B7280]">Mastery</p>
        </div>
      </div>
      <ul className="flex-1 space-y-1 text-[11px] text-[#6B7280]">
        <li className="flex justify-between">
          <span>Correct</span>
          <span className="text-[#22C55E]">
            {correct} ({Math.round(correctPct)}%)
          </span>
        </li>
        <li className="flex justify-between">
          <span>Incorrect</span>
          <span className="text-[#EF4444]">
            {incorrect} ({Math.round(incorrectPct)}%)
          </span>
        </li>
        <li className="flex justify-between">
          <span>Unattempted</span>
          <span>{unattempted} ({Math.round((unattempted / total) * 100)}%)</span>
        </li>
      </ul>
    </div>
  );
}

export function PracticeSubjectDashboard({ subjectSlug }: { subjectSlug: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const clearAttempt = usePracticeAttemptStore((s) => s.clearAttempt);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["practice-subject", subjectSlug],
    queryFn: () => fetchPracticeSubject(subjectSlug),
  });

  if (isLoading) return <p className="text-center text-[#6B7280]">Loading...</p>;
  if (isError || !data) {
    return <p className="text-center text-[#EF4444]">Could not load practice subject.</p>;
  }

  const { course, stats, performance, tests, topics, lessons } = data;
  const SubjectIcon = getStoreCourseIcon(course.icon);
  const perf = performance ?? { mastery_pct: stats.mastery_pct, correct: 0, incorrect: 0, unattempted: 0 };

  return (
    <div>
      <Breadcrumbs items={[{ label: "Practice", href: "/practice" }, { label: course.title }]} />

      <div className="ed-card mb-6 flex flex-wrap gap-4 p-5">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl"
          style={{ backgroundColor: course.icon_bg }}
        >
          <SubjectIcon className="h-7 w-7 text-[#0057FF]" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-bold text-[#002B7F]">{course.title}</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            {course.description ?? "Test your knowledge with practice exams and review video lessons."}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-[#6B7280]">
            <span>Total Questions: {stats.total_questions}</span>
            <span>Total Tests: {stats.total_tests}</span>
            <span className="font-semibold text-[#0057FF]">Your Mastery: {stats.mastery_pct}%</span>
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-4 overflow-x-auto border-b border-[#E5EAF2] text-[13px]">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 border-b-2 px-1 pb-2 font-medium transition-colors ${
              activeTab === tab
                ? "border-[#0057FF] text-[#0057FF]"
                : "border-transparent text-[#6B7280] hover:text-[#374151]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {(activeTab === "Overview" || activeTab === "Practice Tests") && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-[#002B7F]">Practice Tests</h2>
                <span className="text-[13px] text-[#6B7280]">{tests.length} available</span>
              </div>
              <div className="space-y-3">
                {tests.map((test) => {
                  const TestIcon = getPracticeTestIcon(test.icon);
                  return (
                    <div key={test.id} className="ed-card flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EBF2FF]">
                          <TestIcon className="h-5 w-5 text-[#0057FF]" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#002B7F]">{test.title}</p>
                          <p className="text-[12px] text-[#6B7280]">{test.description}</p>
                          <p className="mt-1 text-[11px] text-[#6B7280]">
                            {test.question_count} Questions · {test.duration_minutes} mins · Pass {test.passing_score}%
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/practice/${subjectSlug}/test/${test.slug}`}
                        onClick={() => clearAttempt()}
                        className="ed-btn-primary shrink-0 text-[13px]"
                      >
                        Start Test
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === "Overview" && lessons.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-[#002B7F]">Video Course Section</h2>
                <Link href={`/courses/${course.slug}/lessons/1`} className="text-[13px] text-[#0057FF] hover:underline">
                  View All Lessons
                </Link>
              </div>
              <div className="space-y-3">
                {lessons.slice(0, 3).map((lesson) => (
                  <div key={lesson.id} className="ed-card flex flex-wrap items-center gap-4 p-4">
                    <div className="relative flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-[#001E5A]/90">
                      <Play className="h-6 w-6 text-white" fill="white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#002B7F]">{lesson.title}</p>
                      <p className="text-[12px] text-[#6B7280]">Duration: {formatDuration(lesson.duration_seconds)}</p>
                    </div>
                    <Link href={`/courses/${course.slug}/lessons/${lesson.sort_order}`} className="ed-btn-outline text-[13px]">
                      Watch Lesson
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "Question Bank" && (
            <section>
              <h2 className="mb-3 text-[15px] font-semibold text-[#002B7F]">Question Bank by Topic</h2>
              {topics.length === 0 ? (
                <p className="text-[13px] text-[#6B7280]">No topics available yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {topics.map((topic) => (
                    <div key={topic.name} className="ed-card p-4">
                      <div className="mb-2 flex justify-between text-[13px]">
                        <span className="font-medium text-[#002B7F]">{topic.name}</span>
                        <span className="text-[#6B7280]">{topic.question_count} Qs</span>
                      </div>
                      <ProgressBar value={topic.progress_pct} height={6} />
                      <p className="mt-1 text-[11px] text-[#6B7280]">{topic.progress_pct}% mastered</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "Performance" && (
            <section className="ed-card p-5">
              <h2 className="mb-4 text-[15px] font-semibold text-[#002B7F]">Performance Overview</h2>
              <PerformanceDonut
                mastery={perf.mastery_pct}
                correct={perf.correct}
                incorrect={perf.incorrect}
                unattempted={perf.unattempted}
              />
              <div className="mt-4 rounded-lg bg-[#EBF2FF] p-3 text-[12px] leading-relaxed text-[#374151]">
                <Lightbulb className="mb-1 inline h-4 w-4 text-[#0057FF]" />
                {perf.mastery_pct > 0
                  ? ` You're at ${perf.mastery_pct}% mastery. Keep practicing weak topics to improve your score.`
                  : " Take your first practice test to start tracking performance in real time."}
              </div>
            </section>
          )}
        </div>

        {(activeTab === "Overview" || activeTab === "Performance") && (
          <div className="space-y-4">
            <RightPanel title="Your Performance">
              <PerformanceDonut
                mastery={perf.mastery_pct}
                correct={perf.correct}
                incorrect={perf.incorrect}
                unattempted={perf.unattempted}
              />
            </RightPanel>

            {activeTab === "Overview" && (
              <RightPanel title="Quick Practice">
                {tests[0] && (
                  <Link
                    href={`/practice/${subjectSlug}/test/${tests[0].slug}`}
                    onClick={() => clearAttempt()}
                    className="flex w-full items-center justify-between border-b border-[#E5EAF2] py-2.5 text-[13px] text-[#374151] hover:text-[#0057FF]"
                  >
                    Start Latest Test
                    <ChevronRight className="h-4 w-4 text-[#6B7280]" />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab("Question Bank")}
                  className="flex w-full items-center justify-between border-b border-[#E5EAF2] py-2.5 text-[13px] text-[#374151] hover:text-[#0057FF]"
                >
                  Browse Question Bank
                  <ChevronRight className="h-4 w-4 text-[#6B7280]" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("Performance")}
                  className="flex w-full items-center justify-between py-2.5 text-[13px] text-[#374151] hover:text-[#0057FF]"
                >
                  View Performance
                  <ChevronRight className="h-4 w-4 text-[#6B7280]" />
                </button>
              </RightPanel>
            )}

            {activeTab === "Overview" && topics.length > 0 && (
              <RightPanel title="Topics">
                {topics.slice(0, 5).map((topic) => (
                  <div key={topic.name} className="mb-3 last:mb-0">
                    <div className="mb-1 flex justify-between text-[12px]">
                      <span className="line-clamp-1 text-[#374151]">{topic.name}</span>
                      <span className="shrink-0 font-medium text-[#0057FF]">{topic.progress_pct}%</span>
                    </div>
                    <ProgressBar value={topic.progress_pct} height={5} />
                  </div>
                ))}
              </RightPanel>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
