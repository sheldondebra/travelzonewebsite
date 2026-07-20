import {
  Activity,
  Baby,
  ClipboardList,
  Globe2,
  GraduationCap,
  Heart,
  Shield,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const practiceTestIcons: Record<string, LucideIcon> = {
  clipboard: ClipboardList,
  stethoscope: Stethoscope,
  shield: Shield,
  activity: Activity,
  baby: Baby,
  heart: Heart,
  cap: GraduationCap,
  globe: Globe2,
};

export function getPracticeTestIcon(icon: string): LucideIcon {
  return practiceTestIcons[icon] ?? ClipboardList;
}
