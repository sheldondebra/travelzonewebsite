"use client";

import { useMemo, useState } from "react";
import {
  getOpenDaysSummary,
  isConsultationDateSelectable,
} from "@/lib/consultation-availability";
import type { ConsultationAvailabilitySettings } from "@/lib/settings-types";
import {
  formatShortDate,
  getLocalTodayIso,
  monthLabel,
  toIsoDate,
} from "@/lib/date-utils";

type ConsultationDatePickerProps = {
  availability: ConsultationAvailabilitySettings;
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month: month - 1, day };
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function ConsultationDatePicker({
  availability,
  value,
  onChange,
  error,
}: ConsultationDatePickerProps) {
  const minDate = getLocalTodayIso();
  const initialView = value
    ? startOfMonth(new Date(parseIso(value).year, parseIso(value).month, 1))
    : startOfMonth(new Date());

  const [viewDate, setViewDate] = useState(initialView);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number; iso: string } | null> = [];

    for (let i = 0; i < firstDay; i += 1) cells.push(null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ day, iso: toIsoDate(viewYear, viewMonth, day) });
    }

    return cells;
  }, [viewMonth, viewYear]);

  function shiftMonth(delta: number) {
    setViewDate(new Date(viewYear, viewMonth + delta, 1));
  }

  return (
    <div
      className={`rounded-xl border bg-white p-4 ${
        error ? "border-brand-red" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-navy hover:border-brand-red hover:text-brand-red"
          aria-label="Previous month"
        >
          ←
        </button>
        <p className="text-sm font-semibold text-navy">{monthLabel(viewYear, viewMonth)}</p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-navy hover:border-brand-red hover:text-brand-red"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <p className="mt-3 text-xs text-text-muted">{getOpenDaysSummary(availability)}</p>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="py-1 text-[11px] font-semibold tracking-wide text-text-muted uppercase"
          >
            {day}
          </span>
        ))}

        {calendarDays.map((cell, index) => {
          if (!cell) {
            return <span key={`empty-${index}`} aria-hidden />;
          }

          const selectable = isConsultationDateSelectable(cell.iso, availability, minDate);
          const isSelected = value === cell.iso;
          const isToday = cell.iso === minDate;
          const dayOfWeek = new Date(
            parseIso(cell.iso).year,
            parseIso(cell.iso).month,
            cell.day,
          ).getDay();
          const isClosed = !availability.openDays.includes(dayOfWeek);

          return (
            <button
              key={cell.iso}
              type="button"
              disabled={!selectable}
              onClick={() => onChange(cell.iso)}
              title={isClosed ? "Not available on this day" : undefined}
              className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                isSelected
                  ? "bg-brand-red font-semibold text-white"
                  : selectable
                    ? "text-navy hover:bg-cream"
                    : "cursor-not-allowed text-gray-300"
              } ${isToday && !isSelected ? "ring-1 ring-brand-red/40" : ""}`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {value ? (
        <p className="mt-4 rounded-lg bg-cream px-3 py-2 text-xs text-navy">
          Selected: <span className="font-semibold">{formatShortDate(value)}</span>
        </p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-brand-red">{error}</p> : null}
    </div>
  );
}
