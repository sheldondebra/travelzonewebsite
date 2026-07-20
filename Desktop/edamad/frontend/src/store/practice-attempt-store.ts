import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TestSubmitResult } from "@/types/practice";

export interface AttemptAnswer {
  question_id: number;
  selected: string | null;
}

interface AttemptState {
  testSlug: string | null;
  subjectSlug: string | null;
  currentIndex: number;
  answers: Record<number, string | null>;
  startedAt: number | null;
  elapsedSeconds: number;
  durationMinutes: number;
  result: TestSubmitResult | null;
  reviewIncorrectOnly: boolean;

  initAttempt: (subjectSlug: string, testSlug: string, questionIds: number[], durationMinutes: number) => void;
  setAnswer: (questionId: number, selected: string | null) => void;
  clearAnswer: (questionId: number) => void;
  setCurrentIndex: (index: number) => void;
  tickElapsed: () => void;
  setResult: (result: TestSubmitResult) => void;
  setReviewIncorrectOnly: (value: boolean) => void;
  clearAttempt: () => void;
  getRemainingSeconds: () => number | null;
}

export const usePracticeAttemptStore = create<AttemptState>()(
  persist(
    (set, get) => ({
      testSlug: null,
      subjectSlug: null,
      currentIndex: 0,
      answers: {},
      startedAt: null,
      elapsedSeconds: 0,
      durationMinutes: 60,
      result: null,
      reviewIncorrectOnly: false,

      initAttempt: (subjectSlug, testSlug, questionIds, durationMinutes) => {
        const existing = get();
        if (existing.testSlug === testSlug) {
          return;
        }

        const answers: Record<number, string | null> = {};
        questionIds.forEach((id) => {
          answers[id] = null;
        });
        set({
          subjectSlug,
          testSlug,
          currentIndex: 0,
          answers,
          startedAt: Date.now(),
          elapsedSeconds: 0,
          durationMinutes,
          result: null,
          reviewIncorrectOnly: false,
        });
      },

      setAnswer: (questionId, selected) =>
        set((s) => ({ answers: { ...s.answers, [questionId]: selected } })),

      clearAnswer: (questionId) =>
        set((s) => ({ answers: { ...s.answers, [questionId]: null } })),

      setCurrentIndex: (index) => set({ currentIndex: index }),

      tickElapsed: () => {
        const { startedAt } = get();
        if (!startedAt) return;
        set({ elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000) });
      },

      getRemainingSeconds: () => {
        const { durationMinutes, startedAt } = get();
        if (!startedAt || durationMinutes <= 0) return null;
        const limit = durationMinutes * 60;
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        return Math.max(0, limit - elapsed);
      },

      setResult: (result) => set({ result }),

      setReviewIncorrectOnly: (value) => set({ reviewIncorrectOnly: value }),

      clearAttempt: () =>
        set({
          testSlug: null,
          subjectSlug: null,
          currentIndex: 0,
          answers: {},
          startedAt: null,
          elapsedSeconds: 0,
          durationMinutes: 60,
          result: null,
          reviewIncorrectOnly: false,
        }),
    }),
    { name: "edamad-practice-attempt" },
  ),
);

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}
