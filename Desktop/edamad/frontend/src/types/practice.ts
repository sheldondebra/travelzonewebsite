export interface PracticeSubject {
  slug: string;
  title: string;
  description: string | null;
  icon: string;
  icon_bg: string;
  tests_count: number;
  total_questions: number;
  mastery_pct: number;
}

export interface PracticeTestSummary {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  icon: string;
  duration_minutes: number;
  question_count: number;
  passing_score: number;
}

export interface PracticeTopic {
  name: string;
  progress_pct: number;
  question_count: number;
}

export interface PracticeSubjectDetail {
  course: {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    icon: string;
    icon_bg: string;
  };
  stats: {
    total_questions: number;
    total_tests: number;
    mastery_pct: number;
  };
  performance: {
    mastery_pct: number;
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  tests: PracticeTestSummary[];
  topics: PracticeTopic[];
  lessons: {
    id: number;
    title: string;
    duration_seconds: number;
    sort_order: number;
  }[];
}

export interface PracticeQuestion {
  id: number;
  question_text: string;
  options: Record<string, string>;
  correct_answer?: string;
  explanation?: string | null;
  reference?: string | null;
  topic: string | null;
}

export interface QuestionFeedback {
  question_id: number;
  is_correct: boolean;
  correct_answer: string;
  explanation: string | null;
  reference: string | null;
}

export interface PracticeTestDetail {
  test: PracticeTestSummary & { course_id: number };
  course: {
    id: number;
    title: string;
    slug: string;
    icon: string;
    icon_bg: string;
  };
  questions: PracticeQuestion[];
}

export interface TestSubmitResult {
  test: { id: number; title: string; slug: string; passing_score: number };
  course: { title: string; slug: string } | null;
  total_questions: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  score_pct: number;
  passed: boolean;
  time_taken_seconds: number;
  results: {
    question_id: number;
    selected: string | null;
    correct_answer: string;
    is_correct: boolean;
    topic: string | null;
  }[];
  section_performance: {
    name: string;
    correct: number;
    total: number;
    score_pct: number;
  }[];
  attempt_id?: number;
}
