import api from "@/lib/api";

export type AdminLessonRow = {
  id: number;
  title: string;
  course: string;
  module: string | null;
  type: string;
  status: string;
  duration_seconds: number;
  updated_at: string;
};

export type AdminEnrollmentRow = {
  id: number;
  student: string;
  email: string;
  course: string;
  progress: number;
  enrolled_at: string;
  completed_at: string | null;
};

export type AdminCertificateRow = {
  id: number;
  student: string;
  email: string;
  course: string;
  issued_at: string;
  certificate_id: string;
};

export async function fetchAdminLessons() {
  const { data } = await api.get<AdminLessonRow[]>("/admin/lessons");
  return data;
}

export async function fetchAdminEnrollments() {
  const { data } = await api.get<AdminEnrollmentRow[]>("/admin/enrollments");
  return data;
}

export async function fetchAdminCertificates() {
  const { data } = await api.get<AdminCertificateRow[]>("/admin/certificates");
  return data;
}

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export { formatDuration };
