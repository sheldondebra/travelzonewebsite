export type AdminStat = {
  label: string;
  value: number;
  trend: number;
  trendLabel: string;
};

export type AdminActivity = {
  id: string;
  text: string;
  time: string;
  type: "user" | "course" | "lesson" | "certificate" | "ticket";
};

export type TopCourse = {
  id: string;
  title: string;
  enrollments: number;
  completion: number;
};

export type UserBreakdown = {
  label: string;
  count: number;
  percent: number;
  color: string;
};

export type AdminTicket = {
  id: string;
  subject: string;
  user: string;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved";
  date: string;
};

export const adminStats: AdminStat[] = [
  { label: "Total Users", value: 1248, trend: 12.5, trendLabel: "from last month" },
  { label: "Total Courses", value: 68, trend: 8.3, trendLabel: "from last month" },
  { label: "Active Enrollments", value: 3560, trend: 15.7, trendLabel: "from last month" },
  { label: "Certificates Issued", value: 1025, trend: 10.2, trendLabel: "from last month" },
  { label: "Open Tickets", value: 24, trend: -4.2, trendLabel: "from last month" },
];

export const enrollmentChartData = [
  { month: "Dec 2023", enrollments: 420, completions: 280 },
  { month: "Jan 2024", enrollments: 510, completions: 340 },
  { month: "Feb 2024", enrollments: 580, completions: 390 },
  { month: "Mar 2024", enrollments: 640, completions: 450 },
  { month: "Apr 2024", enrollments: 720, completions: 520 },
  { month: "May 2024", enrollments: 810, completions: 590 },
];

export const recentActivities: AdminActivity[] = [
  { id: "a1", text: "New user registered (Fatima Ali)", time: "2 mins ago", type: "user" },
  { id: "a2", text: "Course created (Advanced Cardiac Life Support)", time: "25 mins ago", type: "course" },
  { id: "a3", text: "Lesson updated (Lesson 4 in Mental Health Nursing)", time: "1 hour ago", type: "lesson" },
  { id: "a4", text: "Certificate issued (Ahmed Khan)", time: "2 hours ago", type: "certificate" },
  { id: "a5", text: "New support ticket (Login issue by Sarah Johnson)", time: "3 hours ago", type: "ticket" },
];

export const topCourses: TopCourse[] = [
  { id: "c1", title: "Adult Medical-Surgical Nursing", enrollments: 842, completion: 66 },
  { id: "c2", title: "Pharmacology for Nurses", enrollments: 756, completion: 62 },
  { id: "c3", title: "Mental Health Nursing", enrollments: 698, completion: 58 },
  { id: "c4", title: "Human Anatomy & Physiology", enrollments: 645, completion: 72 },
  { id: "c5", title: "Obstetrics Nursing", enrollments: 612, completion: 70 },
];

export const userBreakdown: UserBreakdown[] = [
  { label: "Students", count: 874, percent: 70, color: "#0057FF" },
  { label: "Instructors", count: 186, percent: 15, color: "#22C55E" },
  { label: "Administrators", count: 88, percent: 7, color: "#8B5CF6" },
  { label: "Others", count: 100, percent: 8, color: "#F59E0B" },
];

export const adminTickets: AdminTicket[] = [
  {
    id: "#1245",
    subject: "Unable to access videos",
    user: "Sarah Johnson",
    priority: "High",
    status: "Open",
    date: "21 May 2024",
  },
  {
    id: "#1244",
    subject: "Payment not reflected",
    user: "Michael Chen",
    priority: "Medium",
    status: "In Progress",
    date: "20 May 2024",
  },
  {
    id: "#1243",
    subject: "Certificate download issue",
    user: "Amina Hassan",
    priority: "Low",
    status: "Resolved",
    date: "19 May 2024",
  },
  {
    id: "#1242",
    subject: "Password reset not working",
    user: "James Wilson",
    priority: "High",
    status: "Open",
    date: "18 May 2024",
  },
];

export const adminProfileDefaults = {
  name: "Admin User",
  email: "admin@edamad.com",
  role: "Super Admin",
  initials: "AA",
};

export function filterDashboardSearch(
  query: string,
  data?: {
    tickets?: AdminTicket[];
    courses?: TopCourse[];
    activities?: AdminActivity[];
  },
) {
  const q = query.trim().toLowerCase();
  const tickets = data?.tickets ?? adminTickets;
  const courses = data?.courses ?? topCourses;
  const activities = data?.activities ?? recentActivities;
  if (!q) return { tickets, courses, activities };
  return {
    tickets: tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.user.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q),
    ),
    courses: courses.filter((c) => c.title.toLowerCase().includes(q)),
    activities: activities.filter((a) => a.text.toLowerCase().includes(q)),
  };
}
