export type UploadRecord = {
  id: string;
  fileName: string;
  uploadedAt: string;
  questionCount: number;
  status: "Success" | "Failed" | "Processing";
  message?: string;
};

export type AkqFile = {
  version: string;
  subject?: string;
  questions: {
    question_text: string;
    options: Record<string, string>;
    correct_answer: string;
    explanation?: string;
  }[];
};

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const UPLOAD_HISTORY_KEY = "edamad-upload-history";

export const sampleAkqTemplate: AkqFile = {
  version: "1.0",
  subject: "Pharmacology",
  questions: [
    {
      question_text: "Which medication class is commonly used to treat hypertension?",
      options: {
        A: "ACE inhibitors",
        B: "Antibiotics",
        C: "Antihistamines",
        D: "Anticoagulants",
      },
      correct_answer: "A",
      explanation: "ACE inhibitors are first-line agents for hypertension management.",
    },
    {
      question_text: "A nurse verifies the right patient before medication administration. This reflects which safety principle?",
      options: {
        A: "Evidence-based practice",
        B: "Rights of medication administration",
        C: "Informed consent",
        D: "Chain of custody",
      },
      correct_answer: "B",
      explanation: "The rights of medication administration include verifying the right patient.",
    },
  ],
};

export function loadUploadHistory(): UploadRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(UPLOAD_HISTORY_KEY);
    if (raw) return JSON.parse(raw) as UploadRecord[];
  } catch {
    /* ignore */
  }
  return [];
}

export function saveUploadHistory(records: UploadRecord[]) {
  localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(records));
}

export function validateAkqFile(data: unknown): { valid: boolean; questionCount: number; error?: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, questionCount: 0, error: "Invalid file structure." };
  }
  const file = data as AkqFile;
  if (!file.version) {
    return { valid: false, questionCount: 0, error: "Missing version field." };
  }
  if (!Array.isArray(file.questions) || file.questions.length === 0) {
    return { valid: false, questionCount: 0, error: "No questions found in file." };
  }
  for (let i = 0; i < file.questions.length; i++) {
    const q = file.questions[i];
    if (!q.question_text || !q.options || !q.correct_answer) {
      return { valid: false, questionCount: 0, error: `Question ${i + 1} is missing required fields.` };
    }
  }
  return { valid: true, questionCount: file.questions.length };
}

export function downloadAkqTemplate() {
  const blob = new Blob([JSON.stringify(sampleAkqTemplate, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "edamad-questions-template.akq";
  a.click();
  URL.revokeObjectURL(url);
}
