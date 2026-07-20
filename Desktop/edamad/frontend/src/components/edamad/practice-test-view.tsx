"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Lightbulb,
  Settings,
  XCircle,
} from "lucide-react";
import { Breadcrumbs } from "@/components/edamad/breadcrumbs";
import { ProgressBar } from "@/components/edamad/progress-bar";
import { QuestionNavigator } from "@/components/edamad/question-navigator";
import { RightPanel } from "@/components/edamad/right-panel";
import { checkPracticeAnswer, submitPracticeTest } from "@/services/practice";
import {
  formatElapsed,
  usePracticeAttemptStore,
} from "@/store/practice-attempt-store";
import type { PracticeTestDetail, QuestionFeedback } from "@/types/practice";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

export function PracticeTestView({
  data,
  subjectSlug,
  review = false,
}: {
  data: PracticeTestDetail;
  subjectSlug: string;
  review?: boolean;
}) {
  const router = useRouter();
  const { test, course, questions } = data;
  const total = questions.length;

  const {
    answers,
    currentIndex,
    elapsedSeconds,
    durationMinutes,
    result,
    reviewIncorrectOnly,
    initAttempt,
    setAnswer,
    clearAnswer,
    setCurrentIndex,
    tickElapsed,
    setResult,
    getRemainingSeconds,
  } = usePracticeAttemptStore();

  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, QuestionFeedback>>({});
  const [checkingId, setCheckingId] = useState<number | null>(null);

  useEffect(() => {
    const store = usePracticeAttemptStore;
    if (store.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return store.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const questionIdsKey = useMemo(() => questions.map((q) => q.id).join(","), [questions]);

  useEffect(() => {
    if (!hydrated || review) return;
    initAttempt(subjectSlug, test.slug, questions.map((q) => q.id), test.duration_minutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-init when test identity changes
  }, [hydrated, review, subjectSlug, test.slug, test.duration_minutes, questionIdsKey]);

  useEffect(() => {
    if (review) return;
    const id = setInterval(() => {
      tickElapsed();
      setRemainingSeconds(getRemainingSeconds());
    }, 1000);
    return () => clearInterval(id);
  }, [review, tickElapsed, getRemainingSeconds]);

  const handleFinish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        answers: questions.map((q) => ({
          question_id: q.id,
          selected: answers[q.id] ?? null,
        })),
        time_taken_seconds: elapsedSeconds,
      };
      const res = await submitPracticeTest(test.slug, payload);
      setResult(res);
      router.push(`/practice/${subjectSlug}/test/${test.slug}/summary`);
    } catch {
      toast.error("Could not submit your test. Check that the backend is running and try again.");
    } finally {
      setSubmitting(false);
    }
  }, [submitting, questions, answers, elapsedSeconds, test.slug, setResult, router, subjectSlug]);

  useEffect(() => {
    if (review || submitting) return;
    if (remainingSeconds === 0) {
      toast.message("Time is up! Submitting your test...");
      handleFinish();
    }
  }, [remainingSeconds, review, submitting, handleFinish]);

  const reviewQuestions = useMemo(() => {
    if (!review || !result) return questions;
    if (!reviewIncorrectOnly) return questions;
    const incorrectIds = new Set(
      result.results
        .filter((r) => !r.is_correct)
        .map((r) => r.question_id),
    );
    return questions.filter((q) => incorrectIds.has(q.id));
  }, [review, reviewIncorrectOnly, result, questions]);

  const activeQuestions = review ? reviewQuestions : questions;
  const safeIndex = Math.min(currentIndex, Math.max(activeQuestions.length - 1, 0));
  const question = activeQuestions[safeIndex];
  const questionNum = safeIndex + 1;
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]).length,
    [questions, answers],
  );
  const progressPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  const answeredNumbers = useMemo(
    () =>
      questions
        .map((q, i) => (answers[q.id] ? i + 1 : null))
        .filter((n): n is number => n !== null),
    [questions, answers],
  );

  const reviewResults = useMemo(() => {
    if (!result) return undefined;
    const map: Record<number, "correct" | "incorrect"> = {};
    questions.forEach((q, i) => {
      const r = result.results.find((x) => x.question_id === q.id);
      if (!r?.selected) return;
      map[i + 1] = r.is_correct ? "correct" : "incorrect";
    });
    return map;
  }, [result, questions]);

  const selected = question ? answers[question.id] : null;
  const questionFeedback = question ? feedback[question.id] : undefined;
  const resultForQuestion = result?.results.find((r) => r.question_id === question?.id);

  const displayExplanation =
    review
      ? question?.explanation
      : questionFeedback?.explanation ?? null;

  const displayReference =
    review
      ? question?.reference
      : questionFeedback?.reference ?? null;

  const showRationale = review ? !!displayExplanation : !!questionFeedback;

  async function handleSelectAnswer(questionId: number, option: string) {
    if (review || answers[questionId]) return;
    setAnswer(questionId, option);
    setCheckingId(questionId);
    try {
      const res = await checkPracticeAnswer(test.slug, questionId, option);
      setFeedback((prev) => ({ ...prev, [questionId]: res }));
    } catch {
      toast.error("Could not verify your answer. Try again.");
      clearAnswer(questionId);
    } finally {
      setCheckingId(null);
    }
  }

  function goNext() {
    if (review) {
      if (safeIndex < activeQuestions.length - 1) {
        setCurrentIndex(safeIndex + 1);
      } else {
        router.push(`/practice/${subjectSlug}/test/${test.slug}/summary`);
      }
      return;
    }
    if (safeIndex < activeQuestions.length - 1) {
      setCurrentIndex(safeIndex + 1);
    } else {
      handleFinish();
    }
  }

  function goPrev() {
    if (safeIndex > 0) setCurrentIndex(safeIndex - 1);
  }

  if (!question) {
    return <p className="text-center text-[#6B7280]">No questions available.</p>;
  }

  const breadcrumbs = [
    { label: "Practice", href: "/practice" },
    { label: course.title, href: `/practice/${subjectSlug}` },
    {
      label: review ? `Test Review: ${test.title.replace(/^Test \d+: |^Practice Test: /, "")}` : test.title,
    },
  ];

  const timeLimitSeconds = durationMinutes * 60;
  const isLowTime = remainingSeconds !== null && remainingSeconds <= 300;

  return (
    <div>
      <Breadcrumbs
        items={breadcrumbs}
        action={
          <div className="flex items-center gap-2">
            <button type="button" className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#E5EAF2] bg-white px-3 py-1.5 text-[13px] font-medium text-[#0057FF]">
              <Bookmark className="h-4 w-4" />
              {review ? "Bookmark Test" : "Bookmark Question"}
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#E5EAF2] bg-white text-[#6B7280]"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_272px]">
        <div className="space-y-4">
          <div className="ed-card flex flex-wrap items-center gap-4 px-4 py-3">
            <span className="text-[13px] font-semibold text-[#002B7F]">
              Question {questionNum} of {review ? activeQuestions.length : total}
            </span>
            <div className="min-w-[100px] flex-1 max-w-[200px]">
              <ProgressBar value={progressPct} height={6} />
            </div>
            {!review && (
              <div className="ml-auto flex flex-wrap items-center gap-3 text-[12px]">
                <span className="flex items-center gap-1.5 text-[#6B7280]">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium text-[#002B7F]">{formatElapsed(elapsedSeconds)}</span>
                  elapsed
                </span>
                {remainingSeconds !== null && (
                  <span
                    className={`flex items-center gap-1.5 rounded-[8px] px-2 py-1 font-medium ${
                      isLowTime ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#EBF2FF] text-[#0057FF]"
                    }`}
                  >
                    {formatElapsed(remainingSeconds)} left
                  </span>
                )}
              </div>
            )}
            {review && (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-[8px] bg-[#EBF2FF] px-2.5 py-1 text-[11px] font-semibold text-[#0057FF]">
                Review Mode
              </span>
            )}
          </div>

          <div className="ed-card p-5">
            <p className="text-[15px] font-semibold leading-relaxed text-[#002B7F]">{question.question_text}</p>
            <div className="mt-4 space-y-2.5">
              {OPTION_KEYS.filter((k) => question.options[k]).map((key) => {
                const isSelected = selected === key;
                const correctAnswer =
                  review ? question.correct_answer : questionFeedback?.correct_answer;
                const isCorrect = correctAnswer === key;
                let optionCls = "border-[#E5EAF2] bg-white hover:border-[#0057FF]/40";

                if (review && resultForQuestion) {
                  if (isCorrect) optionCls = "border-[#22C55E] bg-[#F0FDF4]";
                  else if (isSelected && !isCorrect) optionCls = "border-[#EF4444] bg-[#FEF2F2]";
                } else if (isSelected && questionFeedback) {
                  optionCls = questionFeedback.is_correct
                    ? "border-[#22C55E] bg-[#F0FDF4]"
                    : "border-[#EF4444] bg-[#FEF2F2]";
                } else if (isSelected) {
                  optionCls = "border-[#0057FF] bg-[#EBF2FF]";
                }

                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-start gap-3 rounded-[10px] border px-4 py-3 transition-colors ${optionCls} ${
                      review || !!answers[question.id] ? "cursor-default" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      checked={isSelected}
                      disabled={review || !!answers[question.id] || checkingId === question.id}
                      onChange={() => handleSelectAnswer(question.id, key)}
                      className="mt-0.5 accent-[#0057FF]"
                    />
                    <span className="flex-1 text-[13px] leading-relaxed text-[#374151]">
                      <span className="font-semibold text-[#002B7F]">{key}.</span> {question.options[key]}
                    </span>
                    {review && isSelected && (
                      <span className="shrink-0 text-[11px] font-medium text-[#6B7280]">Your Answer</span>
                    )}
                    {(review ? isCorrect : isSelected && questionFeedback?.is_correct && isCorrect) && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22C55E]" />
                    )}
                    {(review
                      ? isSelected && !isCorrect
                      : isSelected && questionFeedback && !questionFeedback.is_correct) && (
                      <XCircle className="h-4 w-4 shrink-0 text-[#EF4444]" />
                    )}
                  </label>
                );
              })}
            </div>

            {showRationale && displayExplanation && (
              <div
                className={`mt-4 rounded-[10px] p-4 ${
                  review && resultForQuestion?.is_correct === false
                    ? "border border-[#BBF7D0] bg-[#F0FDF4]"
                    : "bg-[#EBF2FF]"
                }`}
              >
                <p className="flex items-center gap-2 text-[13px] font-semibold text-[#0057FF]">
                  {review ? (
                    <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  ) : (
                    <Lightbulb className="h-4 w-4" />
                  )}
                  Rationale
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#374151]">{displayExplanation}</p>
                {displayReference && (
                  <p className="mt-2 text-[12px] italic text-[#6B7280]">{displayReference}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={safeIndex === 0}
              className="ed-btn-outline gap-1 px-4 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Question
            </button>
            {!review && answeredCount > 0 && safeIndex < questions.length - 1 && (
              <button
                type="button"
                onClick={handleFinish}
                disabled={submitting}
                className="text-[13px] font-medium text-[#0057FF] hover:underline disabled:opacity-50"
              >
                Submit Test Early
              </button>
            )}
            {review && (
              <Link
                href={`/practice/${subjectSlug}/test/${test.slug}/summary`}
                className="text-[13px] font-medium text-[#0057FF] hover:underline"
              >
                Back to Summary
              </Link>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={submitting || checkingId === question.id}
              className="ed-btn-primary gap-1 px-5"
            >
              {review
                ? safeIndex < activeQuestions.length - 1
                  ? "Next Question"
                  : "End Review"
                : safeIndex < questions.length - 1
                  ? "Next Question"
                  : submitting
                    ? "Submitting..."
                    : "Finish Test"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <RightPanel title="Question Navigator">
            <QuestionNavigator
              total={review ? questions.length : total}
              current={review ? questions.findIndex((q) => q.id === question.id) + 1 : questionNum}
              answeredNumbers={answeredNumbers}
              reviewResults={reviewResults}
              mode={review ? "review" : "test"}
              onSelect={(index) => {
                if (review && reviewIncorrectOnly) {
                  const q = questions[index];
                  const idx = activeQuestions.findIndex((x) => x.id === q.id);
                  setCurrentIndex(idx >= 0 ? idx : 0);
                } else if (review) {
                  setCurrentIndex(index);
                } else {
                  setCurrentIndex(index);
                }
              }}
            />
          </RightPanel>
          <RightPanel title={review ? "Review Overview" : "Test Progress"}>
            {review && result ? (
              <ul className="space-y-2.5 text-[13px]">
                <li className="flex justify-between"><span className="text-[#6B7280]">Total Questions</span><span className="font-medium text-[#002B7F]">{result.total_questions}</span></li>
                <li className="flex justify-between"><span className="text-[#6B7280]">Score</span><span className="font-semibold text-[#22C55E]">{result.score_pct}%</span></li>
                <li className="flex justify-between"><span className="text-[#6B7280]">Correct</span><span className="font-medium text-[#22C55E]">{result.correct}</span></li>
                <li className="flex justify-between"><span className="text-[#6B7280]">Incorrect</span><span className="font-medium text-[#EF4444]">{result.incorrect}</span></li>
                <li className="flex justify-between"><span className="text-[#6B7280]">Unanswered</span><span className="font-medium text-[#6B7280]">{result.unanswered}</span></li>
                <li className="flex justify-between"><span className="text-[#6B7280]">Time Taken</span><span className="font-medium text-[#002B7F]">{formatElapsed(result.time_taken_seconds)}</span></li>
              </ul>
            ) : (
              <>
                <div className="mb-2 flex justify-between text-[12px]">
                  <span className="text-[#374151]">{answeredCount} of {total} answered</span>
                  <span className="font-semibold text-[#0057FF]">{progressPct}% Complete</span>
                </div>
                <ProgressBar value={progressPct} height={8} />
                {remainingSeconds !== null && (
                  <p className="mt-3 text-[11px] text-[#6B7280]">
                    Time limit: {durationMinutes} mins ({formatElapsed(timeLimitSeconds)} total)
                  </p>
                )}
              </>
            )}
          </RightPanel>
          <RightPanel title="About this Test">
            <ul className="space-y-2.5 text-[13px] text-[#6B7280]">
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-[#0057FF]" /> Total Questions</span>
                <span className="font-medium text-[#002B7F]">{total}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#0057FF]" /> Time Limit</span>
                <span className="font-medium text-[#002B7F]">{test.duration_minutes} mins</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#0057FF]" /> Passing Score</span>
                <span className="font-medium text-[#002B7F]">{test.passing_score}%</span>
              </li>
            </ul>
          </RightPanel>
        </div>
      </div>
    </div>
  );
}
