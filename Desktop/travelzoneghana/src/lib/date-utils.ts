const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_LOOKUP = MONTH_NAMES.map((name) => name.toLowerCase());

export function formatLongDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;

  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseTravelPeriodMonths(period: string): number[] | null {
  const parts = period.split(/[–—-]/).map((part) => part.trim().toLowerCase());
  if (parts.length !== 2) return null;

  const start = MONTH_LOOKUP.findIndex((name) => parts[0]?.startsWith(name.slice(0, 3)));
  const end = MONTH_LOOKUP.findIndex((name) => parts[1]?.startsWith(name.slice(0, 3)));
  if (start === -1 || end === -1) return null;

  if (start <= end) {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  return [
    ...Array.from({ length: 12 - start }, (_, i) => start + i),
    ...Array.from({ length: end + 1 }, (_, i) => i),
  ];
}

export function isDateSelectable(
  isoDate: string,
  minDate: string,
  allowedMonths: number[] | null,
) {
  if (isoDate < minDate) return false;

  if (!allowedMonths) return true;

  const month = Number(isoDate.slice(5, 7)) - 1;
  return allowedMonths.includes(month);
}

export function getLocalTodayIso(date = new Date()) {
  return toIsoDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatShortDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;

  return new Date(year, month - 1, day).toLocaleDateString("en-GH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function monthLabel(year: number, month: number) {
  return `${MONTH_NAMES[month]} ${year}`;
}

export { MONTH_NAMES };
