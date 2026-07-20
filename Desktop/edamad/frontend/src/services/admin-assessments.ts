import api, { prepareApiRequest } from "@/lib/api";
import type { AkqFile } from "@/lib/bulk-upload-data";

export type AdminAssessment = {
  id: number;
  title: string;
  slug: string;
  course?: string | null;
  question_count: number;
  duration_minutes: number;
  is_published: boolean;
  updated_at?: string;
};

export async function fetchAdminAssessments() {
  const { data } = await api.get<AdminAssessment[]>("/admin/assessments");
  return data;
}

export async function importAssessmentQuestions(payload: AkqFile & { course_id?: number; practice_test_slug?: string }) {
  await prepareApiRequest();
  const { data } = await api.post<{
    message: string;
    imported: number;
    practice_test: { id: number; title: string; slug: string; question_count: number };
  }>("/admin/assessments/import", payload);
  return data;
}
