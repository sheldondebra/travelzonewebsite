import type { ConsultationAvailabilitySettings } from "@/lib/settings-types";
import {
  DEFAULT_CONSULTATION_AVAILABILITY,
  formatTimeSlotLabel,
  getAvailableTimeSlots,
  getNextAvailableConsultationDate,
  getOpenDaysSummary,
  getTimeSlotLabel,
  isConsultationDateSelectable,
  isConsultationTimeSelectable,
  isValidConsultationTime,
  normalizeConsultationAvailability,
} from "@/lib/consultation-availability";

export type ConsultationTopic =
  | "tour-package"
  | "airline-ticketing"
  | "group-travel"
  | "corporate"
  | "insurance-hotels"
  | "other";

export type ConsultationMode = "in-office" | "phone";

export type ConsultationStatus = "pending" | "confirmed" | "cancelled" | "completed";

/** HH:MM (24-hour) time slot value stored on bookings. */
export type ConsultationTimeSlot = string;

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

export const consultationTimeSlots = DEFAULT_CONSULTATION_AVAILABILITY.weekdaySlots;

export function getTopicLabel(topic: ConsultationTopic) {
  return consultationTopics.find((item) => item.value === topic)?.label ?? topic;
}

export function getModeLabel(mode: ConsultationMode) {
  return consultationModes.find((item) => item.value === mode)?.label ?? mode;
}

export {
  DEFAULT_CONSULTATION_AVAILABILITY,
  formatTimeSlotLabel,
  getAvailableTimeSlots,
  getNextAvailableConsultationDate,
  getOpenDaysSummary,
  getTimeSlotLabel,
  isConsultationDateSelectable,
  isConsultationTimeSelectable,
  isValidConsultationTime,
  normalizeConsultationAvailability,
};

export type { ConsultationAvailabilitySettings };
