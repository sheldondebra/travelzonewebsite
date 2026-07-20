export type SupportCategoryId = "account" | "courses" | "payments" | "certificates";

export type SupportArticle = {
  id: string;
  category: SupportCategoryId;
  title: string;
  excerpt: string;
  body: string;
};

export type SupportFaq = {
  id: string;
  question: string;
  answer: string;
  category?: SupportCategoryId;
};

export type SupportTicket = {
  id: string;
  number: string;
  subject: string;
  status: "OPEN" | "RESOLVED" | "PENDING";
  created: string;
  updated: string;
  description?: string;
};

export const supportCategories = [
  {
    id: "account" as const,
    title: "Account & Login",
    description: "Password resets, login issues, and profile settings.",
    accent: "#0057FF",
    iconBg: "#EBF2FF",
  },
  {
    id: "courses" as const,
    title: "Courses & Lessons",
    description: "Accessing lessons, video playback, and course progress.",
    accent: "#22C55E",
    iconBg: "#DCFCE7",
  },
  {
    id: "payments" as const,
    title: "Payments & Billing",
    description: "Checkout, receipts, refunds, and payment methods.",
    accent: "#8B5CF6",
    iconBg: "#EDE9FE",
  },
  {
    id: "certificates" as const,
    title: "Certificates",
    description: "Earning, downloading, and verifying certificates.",
    accent: "#F59E0B",
    iconBg: "#FEF3C7",
  },
];

export const popularTopics = [
  { label: "Account & Login", category: "account" as const },
  { label: "Courses & Lessons", category: "courses" as const },
  { label: "Payments", category: "payments" as const },
  { label: "Certificates", category: "certificates" as const },
];

export const supportArticles: SupportArticle[] = [
  {
    id: "reset-password",
    category: "account",
    title: "How to reset your password",
    excerpt: "Step-by-step guide to recover your account access.",
    body: "Go to the login page and click Forgot Password. Enter your registered email address and check your inbox for a reset link. The link expires after 60 minutes. If you do not receive an email, check your spam folder or contact support.",
  },
  {
    id: "update-profile",
    category: "account",
    title: "Updating your profile information",
    excerpt: "Change your name, email, and contact details.",
    body: "Navigate to Profile from the sidebar, then click Edit Profile. Update your details and save changes. Your email change may require verification before it becomes active.",
  },
  {
    id: "access-lessons",
    category: "courses",
    title: "Accessing purchased course lessons",
    excerpt: "Find and continue your enrolled courses.",
    body: "Open My Courses from the dashboard or go to Progress to see all enrolled courses. Click Continue Learning on any course card to resume where you left off.",
  },
  {
    id: "offline-content",
    category: "courses",
    title: "Downloading course materials",
    excerpt: "Save outlines and slides for offline review.",
    body: "Within any course lesson page, use the Download Course Outline button in the lesson sidebar. Slide downloads are available when provided by the instructor for that session.",
  },
  {
    id: "payment-methods",
    category: "payments",
    title: "Accepted payment methods",
    excerpt: "Cards and mobile money supported at checkout.",
    body: "We accept major debit and credit cards through Paystack, including Visa and Mastercard. Mobile money options may appear based on your region during checkout.",
  },
  {
    id: "refund-policy",
    category: "payments",
    title: "Refund requests",
    excerpt: "When refunds apply and how to request one.",
    body: "Refund requests can be submitted within 7 days of purchase if less than 20% of course content has been accessed. Contact support with your order reference to begin a review.",
  },
  {
    id: "earn-certificate",
    category: "certificates",
    title: "Earning your certificate",
    excerpt: "Completion requirements for certificates.",
    body: "Complete all lessons and required assessments in a course to unlock your certificate. Certificates appear in Profile under Quick Actions once eligibility criteria are met.",
  },
  {
    id: "download-certificate",
    category: "certificates",
    title: "Downloading certificates",
    excerpt: "Save and share your completion certificate.",
    body: "From Profile, click Download Certificates or visit the course completion page. PDF certificates include a verification code for employers and licensing boards.",
  },
];

export const supportFaqs: SupportFaq[] = [
  {
    id: "faq-1",
    question: "How do I reset my password?",
    answer:
      "Click Forgot Password on the login page, enter your email, and follow the link sent to your inbox. Links expire after 60 minutes for security.",
    category: "account",
  },
  {
    id: "faq-2",
    question: "How can I track my course progress?",
    answer:
      "Open Progress from the sidebar to see overall stats and per-course completion. Each course page also shows your overall course progress bar and completed lessons.",
    category: "courses",
  },
  {
    id: "faq-3",
    question: "Can I download course content for offline use?",
    answer:
      "Course outlines and instructor-provided slide decks can be downloaded from the lesson page. Video lessons require an internet connection for streaming.",
    category: "courses",
  },
  {
    id: "faq-4",
    question: "How do I get my certificate?",
    answer:
      "Finish all lessons and required assessments in a course. Your certificate will be available from Profile and the course completion summary.",
    category: "certificates",
  },
  {
    id: "faq-5",
    question: "What payment methods do you accept?",
    answer:
      "We accept Visa, Mastercard, and regional mobile money options through Paystack at checkout.",
    category: "payments",
  },
];

export const defaultTickets: SupportTicket[] = [
  {
    id: "tkt-2413",
    number: "TKT-2413",
    subject: "Unable to access lesson videos",
    status: "OPEN",
    created: "20 May 2024",
    updated: "21 May 2024",
    description: "Videos buffer indefinitely on Pharmacology lesson 3.",
  },
];

export const TICKETS_STORAGE_KEY = "edamad-support-tickets";

export function loadTickets(): SupportTicket[] {
  if (typeof window === "undefined") return defaultTickets;
  try {
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SupportTicket[];
  } catch {
    /* ignore */
  }
  return defaultTickets;
}

export function saveTickets(tickets: SupportTicket[]) {
  localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
}

export function filterSupportContent(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return { articles: [], faqs: [] };
  const articles = supportArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.body.toLowerCase().includes(q),
  );
  const faqs = supportFaqs.filter(
    (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q),
  );
  return { articles, faqs };
}

export function articlesForCategory(category: SupportCategoryId) {
  return supportArticles.filter((a) => a.category === category);
}
