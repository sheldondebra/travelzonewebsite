import { Baby, Bone, Brain, Globe2, GraduationCap, Heart, Pill, Stethoscope } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const storeCourseIcons: Record<string, LucideIcon> = {
  anatomy: Bone,
  pharmacy: Pill,
  advanced: GraduationCap,
  surgical: Stethoscope,
  paediatric: Baby,
  obstetrics: Heart,
  "mental-health": Brain,
  "public-health": Globe2,
};

export function getStoreCourseIcon(icon: string): LucideIcon {
  return storeCourseIcons[icon] ?? Pill;
}

const slugIconMap: Record<string, string> = {
  "human-anatomy-and-physiology": "anatomy",
  pharmacology: "pharmacy",
  "advanced-nursing": "advanced",
  "adult-medical-surgical-nursing": "surgical",
  "paediatric-nursing": "paediatric",
  "obstetrics-nursing": "obstetrics",
  "mental-health-nursing": "mental-health",
  "public-health-nursing": "public-health",
};

export function resolveCartItemIcon(item: { icon?: string; slug: string }): string {
  return item.icon ?? slugIconMap[item.slug] ?? "pharmacy";
}

export function formatGhs(amount: number | string): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  const hasCents = Math.round(value * 100) % 100 !== 0;
  return value.toLocaleString("en-GH", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
}

const courseAccentMap: Record<string, string> = {
  anatomy: "#6366F1",
  pharmacy: "#0057FF",
  advanced: "#0057FF",
  surgical: "#22C55E",
  paediatric: "#EC4899",
  obstetrics: "#EF4444",
  "mental-health": "#14B8A6",
  "public-health": "#0057FF",
};

export function getCourseAccent(icon: string): string {
  return courseAccentMap[icon] ?? "#0057FF";
}
