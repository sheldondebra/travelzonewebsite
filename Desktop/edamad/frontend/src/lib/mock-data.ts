export const storeCourses = [
  {
    id: 1,
    title: "Human Anatomy & Physiology",
    description:
      "Explore the structure, organisation, and function of the human body to build a strong foundation for clinical nursing practice.",
    price: 180,
    icon: "anatomy",
    color: "#E8F0FF",
  },
  {
    id: 2,
    title: "Pharmacology",
    description:
      "Understand drug actions, interactions, and safe medication administration.",
    price: 170,
    icon: "pharmacy",
    color: "#E8F0FF",
  },
  {
    id: 3,
    title: "Adult Medical-Surgical Nursing",
    description: "Comprehensive care across the adult lifespan and clinical settings.",
    price: 200,
    icon: "surgical",
    color: "#E8FFE8",
  },
  {
    id: 4,
    title: "Paediatric Nursing",
    description: "Evidence-based care for infants, children, and adolescents.",
    price: 190,
    icon: "paediatric",
    color: "#FFE8F0",
  },
  {
    id: 5,
    title: "Mental Health Nursing",
    description: "Supporting mental wellness and therapeutic nursing interventions.",
    price: 175,
    icon: "mental",
  },
  {
    id: 6,
    title: "Obstetric Nursing",
    description: "Maternal and newborn health across the care continuum.",
    price: 185,
    icon: "heart",
  },
];

export const cartItems = [
  { id: 2, title: "Pharmacology", price: 170 },
  { id: 3, title: "Adult Medical-Surgical Nursing", price: 200 },
  { id: 4, title: "Advanced Nursing Practice", price: 210 },
  { id: 5, title: "Obstetric Nursing", price: 185 },
  { id: 1, title: "Human Anatomy and Physiology", price: 180 },
];

export const myCourses = [
  {
    slug: "human-anatomy-and-physiology",
    title: "Human Anatomy & Physiology",
    description:
      "Explore the structure, organisation, and function of the human body to build a strong foundation for clinical nursing practice.",
    lessons: 16,
    progress: 70,
    accent: "#6366F1",
    iconBg: "#EDE9FE",
    icon: "bone" as const,
  },
  {
    slug: "pharmacology",
    title: "Pharmacology",
    description:
      "Understand drug actions, interactions, and safe medication administration for clinical practice.",
    lessons: 120,
    progress: 75,
    accent: "#0057FF",
    iconBg: "#E8E4FF",
    icon: "pill" as const,
  },
  {
    slug: "advanced-nursing",
    title: "Advanced Nursing Practice",
    description:
      "Enhance clinical expertise, leadership, and evidence-based decision making to improve patient outcomes.",
    lessons: 16,
    progress: 72,
    accent: "#7C3AED",
    iconBg: "#EDE9FE",
    icon: "cap" as const,
  },
  {
    slug: "paediatric-nursing",
    title: "Paediatric Nursing",
    description:
      "Provide safe, developmentally appropriate care for infants, children and adolescents.",
    lessons: 16,
    progress: 65,
    accent: "#EC4899",
    iconBg: "#FCE7F3",
    icon: "baby" as const,
  },
  {
    slug: "adult-medical-surgical-nursing",
    title: "Adult Medical-Surgical Nursing",
    description:
      "Comprehensive care across the adult lifespan for medical and surgical conditions.",
    lessons: 18,
    progress: 60,
    accent: "#22C55E",
    iconBg: "#DCFCE7",
    icon: "stethoscope" as const,
  },
  {
    slug: "mental-health-nursing",
    title: "Mental Health Nursing",
    description:
      "Promote mental well-being and provide compassionate, evidence-based care for individuals across the lifespan.",
    lessons: 16,
    progress: 68,
    accent: "#14B8A6",
    iconBg: "#CCFBF1",
    icon: "brain" as const,
  },
  {
    slug: "obstetrics-nursing",
    title: "Obstetrics Nursing",
    description:
      "Provide compassionate, evidence-based care for mothers and newborns throughout pregnancy, labour, delivery, and recovery.",
    lessons: 16,
    progress: 70,
    accent: "#EC4899",
    iconBg: "#FFE8F0",
    icon: "heart" as const,
  },
];

export const practiceTests = [
  {
    id: 1,
    title: "Test 1: Basic Pharmacology",
    description: "Foundational pharmacology concepts and safe practice.",
    questions: 40,
    minutes: 60,
  },
  {
    id: 2,
    title: "Test 2: Cardiovascular Drugs",
    description: "Medications affecting the cardiovascular system.",
    questions: 40,
    minutes: 60,
  },
  {
    id: 3,
    title: "Test 3: Antimicrobial Therapy",
    description: "Antibiotics, resistance, and nursing monitoring.",
    questions: 40,
    minutes: 60,
  },
  {
    id: 4,
    title: "Test 4: Pain Management",
    description: "Analgesics, adjuvants, and patient safety.",
    questions: 40,
    minutes: 60,
  },
];

export const lessonList = [
  { id: 1, title: "Introduction to Pharmacology", duration: "12:45", done: true, active: true },
  { id: 2, title: "Drug Classifications", duration: "18:10", done: true },
  { id: 3, title: "Pharmacokinetics", duration: "22:30", done: true },
  { id: 4, title: "Pharmacodynamics", duration: "19:45", done: true },
  { id: 5, title: "Medication Safety", duration: "16:20", done: true },
  { id: 6, title: "Adverse Drug Reactions", duration: "14:55", done: true },
  { id: 7, title: "Cardiovascular Medications", duration: "21:15", done: false },
  { id: 8, title: "Antimicrobial Agents", duration: "20:40", done: false },
  { id: 9, title: "Pain Management Drugs", duration: "17:30", done: false },
  { id: 10, title: "Endocrine Medications", duration: "19:00", done: false },
];

export const progressSummary = {
  coursesEnrolled: 5,
  averageProgress: 68,
  lessonsCompleted: 128,
  certificatesEarned: 24,
} as const;

export const progressCourses = [
  {
    slug: "obstetrics-nursing",
    title: "Obstetrics Nursing",
    description:
      "Provide compassionate, evidence-based care for mothers and newborns throughout pregnancy, labour, delivery, and recovery.",
    progress: 72,
    lessonsDone: 13,
    lessonsTotal: 18,
    studyTime: "11h 30m",
    lastAccessed: "Today",
    accent: "#EC4899",
    iconBg: "#FFE8F0",
    icon: "heart",
  },
  {
    slug: "adult-medical-surgical-nursing",
    title: "Adult Medical-Surgical Nursing",
    description:
      "Comprehensive care across the adult lifespan for medical and surgical conditions.",
    progress: 65,
    lessonsDone: 12,
    lessonsTotal: 18,
    studyTime: "10h 20m",
    lastAccessed: "Yesterday",
    accent: "#22C55E",
    iconBg: "#DCFCE7",
    icon: "stethoscope",
  },
  {
    slug: "paediatric-nursing",
    title: "Paediatric Nursing",
    description:
      "Provide safe, developmentally appropriate care for infants, children and adolescents.",
    progress: 58,
    lessonsDone: 7,
    lessonsTotal: 16,
    studyTime: "6h 10m",
    lastAccessed: "2 days ago",
    accent: "#EC4899",
    iconBg: "#FCE7F3",
    icon: "baby",
  },
  {
    slug: "mental-health-nursing",
    title: "Mental Health Nursing",
    description:
      "Promote mental well-being and provide compassionate, evidence-based care for individuals across the lifespan.",
    progress: 62,
    lessonsDone: 10,
    lessonsTotal: 16,
    studyTime: "7h 40m",
    lastAccessed: "3 days ago",
    accent: "#14B8A6",
    iconBg: "#CCFBF1",
    icon: "brain",
  },
];

export const profileDefaults = {
  name: "Student Name",
  role: "Nursing Student",
  email: "student@email.com",
  phone: "+1 (555) 123-4567",
  joined: "15 March 2024",
  location: "United States",
  about:
    "Passionate nursing student dedicated to providing compassionate, evidence-based patient care. Currently preparing for licensure exams while building strong clinical foundations across medical-surgical, paediatric, and mental health nursing.",
};

export const recentlyAccessedCourses = [
  {
    slug: "human-anatomy-and-physiology",
    title: "Human Anatomy & Physiology",
    progress: 70,
    accent: "#6366F1",
    iconBg: "#EDE9FE",
    icon: "bone",
    lastAccessed: "Today",
  },
  {
    slug: "adult-medical-surgical-nursing",
    title: "Adult Medical-Surgical Nursing",
    progress: 65,
    accent: "#22C55E",
    iconBg: "#DCFCE7",
    icon: "stethoscope",
    lastAccessed: "Yesterday",
  },
  {
    slug: "paediatric-nursing",
    title: "Paediatric Nursing",
    progress: 58,
    accent: "#EC4899",
    iconBg: "#FCE7F3",
    icon: "baby",
    lastAccessed: "2 days ago",
  },
  {
    slug: "mental-health-nursing",
    title: "Mental Health Nursing",
    progress: 62,
    accent: "#14B8A6",
    iconBg: "#CCFBF1",
    icon: "brain",
    lastAccessed: "3 days ago",
  },
  {
    slug: "obstetrics-nursing",
    title: "Obstetrics Nursing",
    progress: 72,
    accent: "#DB2777",
    iconBg: "#FFE8F0",
    icon: "heart",
    lastAccessed: "4 days ago",
  },
];

export const profileAchievements = [
  {
    id: "first-step",
    title: "First Step",
    description: "Completed your first lesson on the platform.",
    earned: "20 Mar 2024",
    accent: "#F59E0B",
    iconBg: "#FEF3C7",
  },
  {
    id: "dedicated-learner",
    title: "Dedicated Learner",
    description: "Completed 50 lessons across enrolled courses.",
    earned: "12 Apr 2024",
    accent: "#0057FF",
    iconBg: "#EBF2FF",
  },
  {
    id: "consistent-learner",
    title: "Consistent Learner",
    description: "Maintained a 7-day learning streak.",
    earned: "28 Apr 2024",
    accent: "#22C55E",
    iconBg: "#DCFCE7",
  },
];
