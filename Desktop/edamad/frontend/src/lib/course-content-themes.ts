export type CourseContentTheme = {
  iconColor: string;
  progressColor: string;
  activeLessonClass: string;
  activeLessonDurationClass: string;
  activePlayIconClass: string;
  video: {
    gradientFrom: string;
    gradientVia: string;
    gradientTo: string;
    glowA: string;
    glowB: string;
    badgeBg: string;
    symbol: string;
    tagline: string;
  };
  tip: string;
  taglineAlign?: "center" | "right";
  videoScene?: "paediatric" | "clinical" | "anatomy" | "obstetrics";
  tipCardClass?: string;
};

const defaultTheme: CourseContentTheme = {
  iconColor: "#0057FF",
  progressColor: "#0057FF",
  activeLessonClass: "bg-[#0057FF] text-white",
  activeLessonDurationClass: "text-white/90",
  activePlayIconClass: "fill-white text-white",
  video: {
    gradientFrom: "#0a1628",
    gradientVia: "#001E5A",
    gradientTo: "#002B7F",
    glowA: "bg-[#0057FF]/30",
    glowB: "bg-[#0057FF]/20",
    badgeBg: "bg-[#0057FF]/30",
    symbol: "📘",
    tagline: "Structured lessons designed for clinical excellence.",
  },
  tip: "Consistent learning helps improve knowledge retention and exam readiness over time.",
};

export const courseContentThemes: Record<string, CourseContentTheme> = {
  pharmacology: {
    iconColor: "#7C3AED",
    progressColor: "#0057FF",
    activeLessonClass: "bg-[#0057FF] text-white",
    activeLessonDurationClass: "text-white/90",
    activePlayIconClass: "fill-white text-white",
    video: {
      gradientFrom: "#0a1628",
      gradientVia: "#001E5A",
      gradientTo: "#002B7F",
      glowA: "bg-[#7C3AED]/40",
      glowB: "bg-[#0057FF]/30",
      badgeBg: "bg-[#7C3AED]/30",
      symbol: "💊",
      tagline: "The right drug, for the right patient, at the right time.",
    },
    tip: "Consistent learning helps improve knowledge retention and exam readiness over time.",
  },
  "adult-medical-surgical-nursing": {
    iconColor: "#22C55E",
    progressColor: "#0057FF",
    activeLessonClass: "bg-[#EBF2FF] text-[#0057FF]",
    activeLessonDurationClass: "text-[#6B7280]",
    activePlayIconClass: "fill-[#0057FF] text-[#0057FF]",
    video: {
      gradientFrom: "#0a1f14",
      gradientVia: "#0f2d1f",
      gradientTo: "#163828",
      glowA: "bg-[#22C55E]/25",
      glowB: "bg-[#0057FF]/20",
      badgeBg: "bg-[#22C55E]/25",
      symbol: "🫀",
      tagline: "Evidence-based care for adults with complex health conditions.",
    },
    tip: "Consistent learning and practice improve clinical judgment and patient outcomes.",
  },
  "paediatric-nursing": {
    iconColor: "#EC4899",
    progressColor: "#0057FF",
    activeLessonClass: "bg-[#EBF2FF] text-[#0057FF]",
    activeLessonDurationClass: "text-[#6B7280]",
    activePlayIconClass: "fill-[#0057FF] text-[#0057FF]",
    taglineAlign: "right",
    videoScene: "paediatric",
    video: {
      gradientFrom: "#1a1020",
      gradientVia: "#3d1f35",
      gradientTo: "#4a2840",
      glowA: "bg-[#EC4899]/30",
      glowB: "bg-[#F472B6]/20",
      badgeBg: "bg-[#EC4899]/25",
      symbol: "🧸",
      tagline: "Compassionate care for children at every stage of development.",
    },
    tip: "Children are not just small adults—their anatomy, physiology and emotional needs require specialized nursing care.",
  },
  "mental-health-nursing": {
    iconColor: "#14B8A6",
    progressColor: "#0057FF",
    activeLessonClass: "bg-[#EBF2FF] text-[#0057FF]",
    activeLessonDurationClass: "text-[#6B7280]",
    activePlayIconClass: "fill-[#0057FF] text-[#0057FF]",
    video: {
      gradientFrom: "#0f1a24",
      gradientVia: "#1a2a3a",
      gradientTo: "#1e3a4a",
      glowA: "bg-[#14B8A6]/30",
      glowB: "bg-[#8B5CF6]/25",
      badgeBg: "bg-[#14B8A6]/20",
      symbol: "🧠",
      tagline: "Supporting minds. Empowering lives.",
    },
    tip: "Early recognition of mental health changes can improve outcomes and help reduce stigma in clinical settings.",
  },
  "advanced-nursing": {
    iconColor: "#7C3AED",
    progressColor: "#0057FF",
    activeLessonClass: "bg-[#EBF2FF] text-[#0057FF]",
    activeLessonDurationClass: "text-[#6B7280]",
    activePlayIconClass: "fill-[#0057FF] text-[#0057FF]",
    taglineAlign: "right",
    videoScene: "clinical",
    video: {
      gradientFrom: "#1a1030",
      gradientVia: "#2d1f4a",
      gradientTo: "#1e2a4a",
      glowA: "bg-[#7C3AED]/35",
      glowB: "bg-[#0057FF]/25",
      badgeBg: "bg-[#7C3AED]/25",
      symbol: "⚕️",
      tagline: "Leading care. Advancing practice. Improving outcomes.",
    },
    tip: "Advanced practice nurses improve access to care, enhance patient satisfaction and reduce healthcare costs.",
  },
  "human-anatomy-and-physiology": {
    iconColor: "#6366F1",
    progressColor: "#0057FF",
    activeLessonClass: "bg-[#EBF2FF] text-[#0057FF]",
    activeLessonDurationClass: "text-[#6B7280]",
    activePlayIconClass: "fill-[#0057FF] text-[#0057FF]",
    taglineAlign: "right",
    videoScene: "anatomy",
    tipCardClass: "bg-[#F3E8FF]",
    video: {
      gradientFrom: "#0a1428",
      gradientVia: "#101e3a",
      gradientTo: "#152a4a",
      glowA: "bg-[#6366F1]/30",
      glowB: "bg-[#0057FF]/25",
      badgeBg: "bg-[#6366F1]/25",
      symbol: "🫁",
      tagline: "The science of the human body and how it functions.",
    },
    tip: "The human body is made up of approximately 37.2 trillion cells working together to maintain life and health.",
  },
  "obstetrics-nursing": {
    iconColor: "#EC4899",
    progressColor: "#0057FF",
    activeLessonClass: "bg-[#EBF2FF] text-[#0057FF]",
    activeLessonDurationClass: "text-[#6B7280]",
    activePlayIconClass: "fill-[#0057FF] text-[#0057FF]",
    taglineAlign: "right",
    videoScene: "obstetrics",
    tipCardClass: "bg-[#FCE7F3]",
    video: {
      gradientFrom: "#2a1020",
      gradientVia: "#4a1a35",
      gradientTo: "#3d2040",
      glowA: "bg-[#EC4899]/30",
      glowB: "bg-[#F472B6]/20",
      badgeBg: "bg-[#EC4899]/25",
      symbol: "🤰",
      tagline: "Compassionate care for mothers and newborns from pregnancy through postpartum recovery.",
    },
    tip: "Early and consistent antenatal care helps identify risks early and improves outcomes for mothers and newborns.",
  },
};

export function getCourseContentTheme(slug: string): CourseContentTheme {
  return courseContentThemes[slug] ?? defaultTheme;
}
