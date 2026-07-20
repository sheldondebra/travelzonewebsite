import api, { prepareApiRequest } from "@/lib/api";
import type {
  PracticeSubject,
  PracticeSubjectDetail,
  PracticeTestDetail,
  QuestionFeedback,
  TestSubmitResult,
} from "@/types/practice";

export async function fetchPracticeSubjects(): Promise<PracticeSubject[]> {
  const { data } = await api.get<PracticeSubject[]>("/practice/subjects");
  return data;
}

export async function fetchPracticeSubject(slug: string): Promise<PracticeSubjectDetail> {
  const { data } = await api.get<PracticeSubjectDetail>(`/practice/subjects/${slug}`);
  return data;
}

export async function fetchPracticeTest(slug: string): Promise<PracticeTestDetail> {
  const { data } = await api.get<PracticeTestDetail>(`/practice/tests/${slug}`);
  return data;
}

export async function fetchPracticeTestReview(slug: string): Promise<PracticeTestDetail> {
  const { data } = await api.get<PracticeTestDetail>(`/practice/tests/${slug}/review`);
  return data;
}

export async function checkPracticeAnswer(
  testSlug: string,
  questionId: number,
  selected: string,
): Promise<QuestionFeedback> {
  await prepareApiRequest();
  const { data } = await api.post<QuestionFeedback>(
    `/practice/tests/${testSlug}/questions/${questionId}/check`,
    { selected },
  );
  return data;
}

export async function submitPracticeTest(
  slug: string,
  payload: {
    answers: { question_id: number; selected: string | null }[];
    time_taken_seconds: number;
  },
): Promise<TestSubmitResult> {
  await prepareApiRequest();
  const { data } = await api.post<TestSubmitResult>(`/practice/tests/${slug}/submit`, payload);
  return data;
}

export async function fetchLatestTestResult(slug: string): Promise<TestSubmitResult> {
  const { data } = await api.get<TestSubmitResult>(`/practice/tests/${slug}/latest-result`);
  return data;
}
