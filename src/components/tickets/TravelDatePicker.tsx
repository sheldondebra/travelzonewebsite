"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { HiCalendarDays, HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { formatShortDate, getLocalTodayIso, monthLabel, toIsoDate } from "@/lib/date-utils";

type TravelDatePickerProps = {
  id: string;
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  minDate?: string;
  error?: string;
  placeholder?: string;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month: month - 1, day };
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isDateSelectable(isoDate: string, minDate: string) {
  return isoDate >= minDate;
}

export function TravelDatePicker({
  id,
  label,
  value,
  onChange,
  minDate = getLocalTodayIso(),
  error,
  placeholder = "Select date",
}: TravelDatePickerProps) {
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const initialView = value
    ? startOfMonth(new Date(parseIso(value).year, parseIso(value).month, 1))
    : startOfMonth(new Date());

  const [viewDate, setViewDate] = useState(initialView);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const today = getLocalTodayIso();

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      const parsed = parseIso(value);
      setViewDate(startOfMonth(new Date(parsed.year, parsed.month, 1)));
    }
  }, [value]);

  function shiftMonth(delta: number) {
    setViewDate(new Date(viewYear, viewMonth + delta, 1));
  }

  function selectDate(iso: string) {
    onChange(iso);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </label>

      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3.5 py-2.5 text-left text-sm transition-colors ${
          error
            ? "border-brand-red focus:border-brand-red focus:ring-2 focus:ring-brand-red/10"
            : "border-gray-200 hover:border-brand-red/40 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10"
        }`}
      >
        <span className={value ? "font-medium text-navy" : "text-gray-400"}>
          {value ? formatShortDate(value) : placeholder}
        </span>
        <HiCalendarDays className="h-4 w-4 shrink-0 text-brand-red" aria-hidden />
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={`${label} calendar`}
          className="absolute z-30 mt-1 w-full min-w-[17rem] rounded-xl border border-gray-200 bg-white p-4 shadow-xl sm:min-w-[18rem]"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-navy hover:border-brand-red hover:text-brand-red"
              aria-label="Previous month"
            >
              <HiChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-navy">{monthLabel(viewYear, viewMonth)}</p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-navy hover:border-brand-red hover:text-brand-red"
              aria-label="Next month"
            >
              <HiChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((day) => (
              <span
                key={day}
                className="py-1 text-[10px] font-semibold tracking-wide text-text-muted uppercase"
              >
                {day}
              </span>
            ))}

            {calendarDays.map((cell, index) => {
              if (!cell) {
                return <span key={`empty-${index}`} aria-hidden />;
              }

              const selectable = isDateSelectable(cell.iso, minDate);
              const isSelected = value === cell.iso;
              const isToday = cell.iso === today;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={!selectable}
                  onClick={() => selectDate(cell.iso)}
                  className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ${
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
            <p className="mt-3 rounded-lg bg-cream px-3 py-2 text-xs text-navy">
              Selected: <span className="font-semibold">{formatShortDate(value)}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-brand-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
