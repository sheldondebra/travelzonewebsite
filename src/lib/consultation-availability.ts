import type { ConsultationAvailabilitySettings } from "@/lib/settings-types";
import { getLocalTodayIso } from "@/lib/date-utils";

export const DEFAULT_CONSULTATION_AVAILABILITY: ConsultationAvailabilitySettings = {
  openDays: [1, 2, 3, 4, 5, 6],
  weekdaySlots: [
    { value: "09:00", label: "9:00 AM" },
    { value: "10:30", label: "10:30 AM" },
    { value: "12:00", label: "12:00 PM" },
    { value: "14:00", label: "2:00 PM" },
    { value: "15:30", label: "3:30 PM" },
  ],
  saturdaySlots: [
    { value: "09:00", label: "9:00 AM" },
    { value: "10:30", label: "10:30 AM" },
    { value: "12:00", label: "12:00 PM" },
  ],
  minNoticeMinutes: 30,
  maxAdvanceDays: 21,
  blockedDates: [],
};

const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatTimeSlotLabel(value: string) {
  const match = value.match(TIME_PATTERN);
  if (!match) return value;

  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return minutes === 0
    ? `${hour12}:00 ${period}`
    : `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function parseLocalDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function normalizeTime(value: string) {
  const trimmed = value.trim();
  if (!TIME_PATTERN.test(trimmed)) return null;
  return trimmed;
}

function normalizeSlot(value: string, label?: string) {
  const normalized = normalizeTime(value);
  if (!normalized) return null;
  return {
    value: normalized,
    label: label?.trim() || formatTimeSlotLabel(normalized),
  };
}

function uniqueSlots(slots: ConsultationAvailabilitySettings["weekdaySlots"]) {
  const seen = new Set<string>();
  return slots.filter((slot) => {
    if (seen.has(slot.value)) return false;
    seen.add(slot.value);
    return true;
  });
}

export function normalizeConsultationAvailability(
  input?: Partial<ConsultationAvailabilitySettings> | null,
): ConsultationAvailabilitySettings {
  const base = DEFAULT_CONSULTATION_AVAILABILITY;
  const openDays = Array.isArray(input?.openDays)
    ? [...new Set(input.openDays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
    : base.openDays;

  const weekdaySlots = uniqueSlots(
    (input?.weekdaySlots ?? base.weekdaySlots)
      .map((slot) =>
        typeof slot === "string"
          ? normalizeSlot(slot)
          : normalizeSlot(slot.value, slot.label),
      )
      .filter((slot): slot is NonNullable<typeof slot> => Boolean(slot)),
  );

  const saturdaySlots = uniqueSlots(
    (input?.saturdaySlots ?? base.saturdaySlots)
      .map((slot) =>
        typeof slot === "string"
          ? normalizeSlot(slot)
          : normalizeSlot(slot.value, slot.label),
      )
      .filter((slot): slot is NonNullable<typeof slot> => Boolean(slot)),
  );

  const blockedDates = Array.isArray(input?.blockedDates)
    ? [...new Set(input.blockedDates.filter((date) => ISO_DATE_PATTERN.test(date)))]
    : base.blockedDates;

  const minNoticeMinutes =
    typeof input?.minNoticeMinutes === "number" && input.minNoticeMinutes >= 0
      ? Math.round(input.minNoticeMinutes)
      : base.minNoticeMinutes;

  const maxAdvanceDays =
    typeof input?.maxAdvanceDays === "number" && input.maxAdvanceDays >= 1
      ? Math.round(input.maxAdvanceDays)
      : base.maxAdvanceDays;

  return {
    openDays: openDays.length > 0 ? openDays : base.openDays,
    weekdaySlots: weekdaySlots.length > 0 ? weekdaySlots : base.weekdaySlots,
    saturdaySlots: saturdaySlots.length > 0 ? saturdaySlots : base.saturdaySlots,
    minNoticeMinutes,
    maxAdvanceDays,
    blockedDates,
  };
}

export function getOpenDaysSummary(config: ConsultationAvailabilitySettings) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const open = config.openDays
    .slice()
    .sort((a, b) => a - b)
    .map((day) => labels[day]);

  if (open.length === 7) return "Open every day.";
  if (open.length === 0) return "No days are currently open.";
  return `Open ${open.join(", ")}.`;
}

function getSlotsForDate(date: string, config: ConsultationAvailabilitySettings) {
  const day = parseLocalDate(date).getDay();
  return day === 6 ? config.saturdaySlots : config.weekdaySlots;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isConsultationDateSelectable(
  date: string,
  config: ConsultationAvailabilitySettings,
  minDate?: string,
) {
  if (!ISO_DATE_PATTERN.test(date)) return false;

  const today = minDate ?? getLocalTodayIso();
  if (date < today) return false;
  if (config.blockedDates.includes(date)) return false;

  const day = parseLocalDate(date).getDay();
  if (!config.openDays.includes(day)) return false;

  const maxDate = addDaysIso(today, config.maxAdvanceDays);
  if (date > maxDate) return false;

  return getSlotsForDate(date, config).length > 0;
}

export function isConsultationTimeSelectable(
  date: string,
  time: string,
  config: ConsultationAvailabilitySettings,
  now = new Date(),
) {
  if (!isConsultationDateSelectable(date, config)) return false;

  const slots = getSlotsForDate(date, config);
  if (!slots.some((slot) => slot.value === time)) return false;

  if (date === getLocalTodayIso(now)) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return timeToMinutes(time) > currentMinutes + config.minNoticeMinutes;
  }

  return true;
}

export function getAvailableTimeSlots(
  date: string,
  config: ConsultationAvailabilitySettings,
  now = new Date(),
) {
  if (!isConsultationDateSelectable(date, config)) return [];

  return getSlotsForDate(date, config).filter((slot) =>
    isConsultationTimeSelectable(date, slot.value, config, now),
  );
}

export function getNextAvailableConsultationDate(
  config: ConsultationAvailabilitySettings,
  now = new Date(),
) {
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i < config.maxAdvanceDays + 1; i += 1) {
    const iso = getLocalTodayIso(cursor);
    if (
      isConsultationDateSelectable(iso, config) &&
      getAvailableTimeSlots(iso, config, now).length > 0
    ) {
      return iso;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return getLocalTodayIso(now);
}

export function getTimeSlotLabel(
  time: string,
  config: ConsultationAvailabilitySettings = DEFAULT_CONSULTATION_AVAILABILITY,
) {
  const slots = [...config.weekdaySlots, ...config.saturdaySlots];
  return slots.find((item) => item.value === time)?.label ?? formatTimeSlotLabel(time);
}

export function isValidConsultationTime(value: string, config: ConsultationAvailabilitySettings) {
  return [...config.weekdaySlots, ...config.saturdaySlots].some((slot) => slot.value === value);
}

function addDaysIso(isoDate: string, days: number) {
  const date = parseLocalDate(isoDate);
  date.setDate(date.getDate() + days);
  return getLocalTodayIso(date);
}

export function parseAvailabilityFormData(formData: FormData): ConsultationAvailabilitySettings {
  const openDays = [0, 1, 2, 3, 4, 5, 6].filter((day) => formData.get(`openDay_${day}`) === "on");

  const weekdaySlots = String(formData.get("weekdaySlots") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => normalizeSlot(line))
    .filter((slot): slot is NonNullable<typeof slot> => Boolean(slot));

  const saturdaySlots = String(formData.get("saturdaySlots") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => normalizeSlot(line))
    .filter((slot): slot is NonNullable<typeof slot> => Boolean(slot));

  const blockedDates = String(formData.get("blockedDates") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => ISO_DATE_PATTERN.test(line));

  return normalizeConsultationAvailability({
    openDays,
    weekdaySlots,
    saturdaySlots,
    minNoticeMinutes: Number(formData.get("minNoticeMinutes") ?? 30),
    maxAdvanceDays: Number(formData.get("maxAdvanceDays") ?? 21),
    blockedDates,
  });
}
