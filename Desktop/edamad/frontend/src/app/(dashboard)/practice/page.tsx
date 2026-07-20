"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  ChevronDown,
  Clock,
  Filter,
  Lightbulb,
  Search,
  Target,
} from "lucide-react";
import { PracticeSubjectCard } from "@/components/edamad/practice-subject-card";
import { fetchPracticeSubjects } from "@/services/practice";

const featureItems = [
  { icon: Clock, title: "Timed Tests", desc: "Practice under real exam conditions" },
  { icon: Lightbulb, title: "Instant Rationale", desc: "Learn why each answer is correct" },
  { icon: BarChart3, title: "Track Mastery", desc: "Monitor progress by topic and subject" },
  { icon: Target, title: "Targeted Review", desc: "Revisit incorrect answers anytime" },
];

export default function PracticePage() {
  const [search, setSearch] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<"default" | "mastery_desc" | "mastery_asc" | "title_asc">("default");

  const { data: subjects = [], isLoading, isError } = useQuery({
    queryKey: ["practice-subjects"],
    queryFn: fetchPracticeSubjects,
  });

  const filtered = useMemo(() => {
    let list = subjects.filter((s) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q)
      );
    });

    switch (sort) {
      case "mastery_desc":
        list = [...list].sort((a, b) => b.mastery_pct - a.mastery_pct);
        break;
      case "mastery_asc":
        list = [...list].sort((a, b) => a.mastery_pct - b.mastery_pct);
        break;
      case "title_asc":
        list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return list;
  }, [subjects, search, sort]);

  const totals = useMemo(
    () => ({
      tests: subjects.reduce((s, x) => s + x.tests_count, 0),
      questions: subjects.reduce((s, x) => s + x.total_questions, 0),
      avgMastery:
        subjects.length > 0
          ? Math.round(subjects.reduce((s, x) => s + x.mastery_pct, 0) / subjects.length)
          : 0,
    }),
    [subjects],
  );

  const sortLabel =
    sort === "default"
      ? "Filter / Sort"
      : sort === "mastery_desc"
        ? "Mastery: High to Low"
        : sort === "mastery_asc"
          ? "Mastery: Low to High"
          : "Title: A to Z";

  return (
    <div>
      <h1 className="text-[22px] font-bold text-[#002B7F]">Practice Tests</h1>
      <p className="mt-1 text-[13px] text-[#6B7280]">
        Choose a nursing subject to take timed exams, review rationales, and track your mastery.
      </p>

      {!isLoading && !isError && subjects.length > 0 && (
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="ed-card px-4 py-3 text-center">
            <p className="text-[18px] font-bold text-[#002B7F]">{subjects.length}</p>
            <p className="text-[11px] text-[#6B7280]">Subjects</p>
          </div>
          <div className="ed-card px-4 py-3 text-center">
            <p className="text-[18px] font-bold text-[#0057FF]">{totals.tests}</p>
            <p className="text-[11px] text-[#6B7280]">Tests</p>
          </div>
          <div className="ed-card px-4 py-3 text-center">
            <p className="text-[18px] font-bold text-[#002B7F]">{totals.questions}</p>
            <p className="text-[11px] text-[#6B7280]">Questions</p>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]" />
          <input
            className="ed-input w-full bg-white pl-10"
            placeholder="Search practice subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-[#E5EAF2] bg-white px-4 text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB]"
          >
            <Filter className="h-4 w-4" />
            {sortLabel}
            <ChevronDown className="h-4 w-4 text-[#6B7280]" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 z-10 mt-1 w-52 rounded-[10px] border border-[#E5EAF2] bg-white py-1 shadow-lg">
              {(
                [
                  ["default", "Default order"],
                  ["mastery_desc", "Mastery: High to Low"],
                  ["mastery_asc", "Mastery: Low to High"],
                  ["title_asc", "Title: A to Z"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSort(value);
                    setSortOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-[13px] hover:bg-[#F7F9FC] ${
                    sort === value ? "font-semibold text-[#0057FF]" : "text-[#374151]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ed-card h-[260px] animate-pulse p-4">
              <div className="mb-3 h-14 w-14 rounded-[10px] bg-[#E5EAF2]" />
              <div className="mb-2 h-4 w-3/4 rounded bg-[#E5EAF2]" />
              <div className="mb-1 h-3 w-full rounded bg-[#F3F4F6]" />
              <div className="h-3 w-2/3 rounded bg-[#F3F4F6]" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="mt-8 text-center text-[13px] text-[#EF4444]">
          Could not load practice subjects. Is the backend running?
        </p>
      ) : filtered.length === 0 ? (
        <div className="ed-card mt-5 py-12 text-center">
          <p className="text-[14px] text-[#6B7280]">No practice subjects match your search.</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((subject) => (
            <PracticeSubjectCard
              key={subject.slug}
              slug={subject.slug}
              title={subject.title}
              description={subject.description}
              icon={subject.icon}
              iconBg={subject.icon_bg}
              testsCount={subject.tests_count}
              totalQuestions={subject.total_questions}
              masteryPct={subject.mastery_pct}
            />
          ))}
        </div>
      )}

      {!isLoading && !isError && subjects.length > 0 && totals.avgMastery > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[12px] bg-[#EBF2FF] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0057FF] text-white">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#002B7F]">
                Overall mastery: {totals.avgMastery}%
              </p>
              <p className="text-[13px] text-[#6B7280]">
                Keep practicing to improve your scores across all subjects.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {featureItems.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-3 rounded-[12px] border border-[#E5EAF2] bg-white p-4">
            <Icon className="h-5 w-5 shrink-0 text-[#0057FF]" strokeWidth={1.75} />
            <div>
              <p className="text-[13px] font-semibold text-[#002B7F]">{title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-[#6B7280]">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
