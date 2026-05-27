import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  ClipboardList,
  ListTodo,
  MessageCircle,
  Package,
  Truck,
} from "lucide-react";

export const TASK_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const statusLabels: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export const statusConfig: Record<
  TaskStatus,
  { badge: string; border: string; dot: string; chip: string; chipActive: string }
> = {
  PENDING: {
    badge: "bg-amber-500/15 text-amber-900 ring-amber-500/20",
    border: "border-l-amber-400",
    dot: "bg-amber-500",
    chip: "border-amber-200/80 bg-white text-amber-900 hover:bg-amber-50",
    chipActive: "border-amber-400 bg-amber-500 text-white shadow-sm",
  },
  IN_PROGRESS: {
    badge: "bg-sky-500/15 text-sky-900 ring-sky-500/20",
    border: "border-l-sky-500",
    dot: "bg-sky-500",
    chip: "border-sky-200/80 bg-white text-sky-900 hover:bg-sky-50",
    chipActive: "border-sky-500 bg-sky-500 text-white shadow-sm",
  },
  DONE: {
    badge: "bg-emerald-500/15 text-emerald-900 ring-emerald-500/20",
    border: "border-l-emerald-500",
    dot: "bg-emerald-500",
    chip: "border-emerald-200/80 bg-white text-emerald-900 hover:bg-emerald-50",
    chipActive: "border-emerald-500 bg-emerald-500 text-white shadow-sm",
  },
  CANCELLED: {
    badge: "bg-muted text-muted-foreground ring-border",
    border: "border-l-muted-foreground/40",
    dot: "bg-muted-foreground/50",
    chip: "border-gray-200 bg-white text-muted-foreground hover:bg-muted/50",
    chipActive: "border-gray-400 bg-gray-500 text-white shadow-sm",
  },
};

export const typeConfig: Record<
  string,
  { label: string; icon: LucideIcon; tone: string }
> = {
  PACKING: {
    label: "Packing",
    icon: Package,
    tone: "bg-violet-500/12 text-violet-800",
  },
  DELIVERY: {
    label: "Delivery",
    icon: Truck,
    tone: "bg-orange-500/12 text-orange-900",
  },
  INVENTORY: {
    label: "Inventory",
    icon: Boxes,
    tone: "bg-cyan-500/12 text-cyan-900",
  },
  FOLLOW_UP: {
    label: "Follow up",
    icon: MessageCircle,
    tone: "bg-primary/15 text-foreground",
  },
  GENERAL: {
    label: "General",
    icon: ListTodo,
    tone: "bg-brand-rose/60 text-foreground",
  },
};

export function taskTypeMeta(type: string) {
  return typeConfig[type] ?? typeConfig.GENERAL;
}
