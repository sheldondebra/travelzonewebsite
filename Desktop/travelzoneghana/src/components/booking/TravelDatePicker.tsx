"use client";

import { useMemo, useState } from "react";
import {
  isDateSelectable,
  monthLabel,
  parseTravelPeriodMonths,
  toIsoDate,
} from "@/lib/date-utils";

type TravelDatePickerProps = {
  value: string;
  onChange: (isoDate: string) => void;
  travelPeriod?: string;
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

export function TravelDatePicker({
  value,
  onChange,
  travelPeriod,
  error,
}: TravelDatePickerProps) {
  const minDate = new Date().toISOString().split("T")[0];
  const allowedMonths = travelPeriod ? parseTravelPeriodMonths(travelPeriod) : null;

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

      {travelPeriod && (
        <p className="mt-3 text-xs text-text-muted">
          Preferred travel window: {travelPeriod}
        </p>
      )}

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

          const selectable = isDateSelectable(cell.iso, minDate, allowedMonths);
          const isSelected = value === cell.iso;
          const isToday = cell.iso === minDate;

          return (
            <button
              key={cell.iso}
              type="button"
              disabled={!selectable}
              onClick={() => onChange(cell.iso)}
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

      {value && (
        <p className="mt-4 rounded-lg bg-cream px-3 py-2 text-xs text-navy">
          Selected:{" "}
          <span className="font-semibold">
            {new Date(`${value}T12:00:00`).toLocaleDateString("en-GH", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </p>
      )}

      {error && <p className="mt-2 text-xs text-brand-red">{error}</p>}
    </div>
  );
}
