import { getLocalTodayIso } from "@/lib/date-utils";

export type ConsultationTopic =
  | "tour-package"
  | "airline-ticketing"
  | "group-travel"
  | "corporate"
  | "insurance-hotels"
  | "other";

export type ConsultationMode = "in-office" | "phone";

export type ConsultationStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type ConsultationTimeSlot = "09:00" | "10:30" | "12:00" | "14:00" | "15:30";

export type ConsultationBooking = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: ConsultationTimeSlot;
  topic: ConsultationTopic;
  mode: ConsultationMode;
  notes?: string;
  status: ConsultationStatus;
  createdAt: string;
};

export type ConsultationInput = {
  fullName: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: ConsultationTimeSlot;
  topic: ConsultationTopic;
  mode: ConsultationMode;
  notes?: string;
};

export type ConsultationResult =
  | { success: true; bookingId: string }
  | { success: false; error: string };

export const consultationTopics: {
  value: ConsultationTopic;
  label: string;
}[] = [
  { value: "tour-package", label: "Tour package planning" },
  { value: "airline-ticketing", label: "Airline ticketing" },
  { value: "group-travel", label: "Group travel" },
  { value: "corporate", label: "Corporate travel" },
  { value: "insurance-hotels", label: "Insurance & hotels" },
  { value: "other", label: "Other" },
];

export const consultationModes: {
  value: ConsultationMode;
  label: string;
}[] = [
  { value: "in-office", label: "Visit our East Legon office" },
  { value: "phone", label: "Phone call" },
];

export const consultationTimeSlots: {
  value: ConsultationTimeSlot;
  label: string;
}[] = [
  { value: "09:00", label: "9:00 AM" },
  { value: "10:30", label: "10:30 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:30", label: "3:30 PM" },
];

const saturdaySlots: ConsultationTimeSlot[] = ["09:00", "10:30", "12:00"];

const slotMinutes: Record<ConsultationTimeSlot, number> = {
  "09:00": 9 * 60,
  "10:30": 10 * 60 + 30,
  "12:00": 12 * 60,
  "14:00": 14 * 60,
  "15:30": 15 * 60 + 30,
};

export function getTopicLabel(topic: ConsultationTopic) {
  return consultationTopics.find((item) => item.value === topic)?.label ?? topic;
}

export function getModeLabel(mode: ConsultationMode) {
  return consultationModes.find((item) => item.value === mode)?.label ?? mode;
}

export function getTimeSlotLabel(time: ConsultationTimeSlot) {
  return consultationTimeSlots.find((item) => item.value === time)?.label ?? time;
}

export function isConsultationDateSelectable(date: string, minDate?: string) {
  const today = minDate ?? getLocalTodayIso();
  if (date < today) return false;

  const day = parseLocalDate(date).getDay();
  return day !== 0;
}

function parseLocalDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isConsultationTimeSelectable(
  date: string,
  time: ConsultationTimeSlot,
  now = new Date(),
) {
  if (!isConsultationDateSelectable(date)) return false;

  const day = parseLocalDate(date).getDay();
  if (day === 6 && !saturdaySlots.includes(time)) return false;

  if (date === getLocalTodayIso(now)) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes[time] > currentMinutes + 30;
  }

  return true;
}

export function getAvailableTimeSlots(date: string, now = new Date()) {
  if (!isConsultationDateSelectable(date)) return [];

  const day = parseLocalDate(date).getDay();
  const base =
    day === 6
      ? consultationTimeSlots.filter((slot) => saturdaySlots.includes(slot.value))
      : consultationTimeSlots;

  return base.filter((slot) => isConsultationTimeSelectable(date, slot.value, now));
}

export function getNextAvailableConsultationDate(now = new Date()) {
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i < 21; i += 1) {
    const iso = getLocalTodayIso(cursor);
    if (
      isConsultationDateSelectable(iso) &&
      getAvailableTimeSlots(iso, now).length > 0
    ) {
      return iso;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return getLocalTodayIso(now);
}
