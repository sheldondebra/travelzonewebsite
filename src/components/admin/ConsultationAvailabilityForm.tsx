"use client";

import { useActionState, useState } from "react";
import {
  saveConsultationAvailabilityAction,
  type ConsultationAvailabilityResult,
} from "@/app/admin/actions/consultations";
import { AdminBlockedDatesPicker } from "@/components/admin/AdminBlockedDatesPicker";
import { AdminTimeSlotPicker } from "@/components/admin/AdminTimeSlotPicker";
import { useAdminActionFeedback } from "@/components/admin/AdminToastProvider";
import { getOpenDaysSummary } from "@/lib/consultation-availability";
import type { ConsultationAvailabilitySettings } from "@/lib/settings-types";

type Props = {
  availability: ConsultationAvailabilitySettings;
  canEdit: boolean;
};

const DAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const WEEKDAY_QUICK_PICKS = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
const SATURDAY_QUICK_PICKS = ["09:00", "10:30", "12:00", "14:00"];

const NOTICE_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
];

const ADVANCE_OPTIONS = [
  { value: 7, label: "1 week ahead" },
  { value: 14, label: "2 weeks ahead" },
  { value: 21, label: "3 weeks ahead" },
  { value: 30, label: "1 month ahead" },
  { value: 60, label: "2 months ahead" },
  { value: 90, label: "3 months ahead" },
];

function slotsToValues(slots: ConsultationAvailabilitySettings["weekdaySlots"]) {
  return slots.map((slot) => slot.value);
}

export function ConsultationAvailabilityForm({ availability, canEdit }: Props) {
  const [weekdaySlots, setWeekdaySlots] = useState(slotsToValues(availability.weekdaySlots));
  const [saturdaySlots, setSaturdaySlots] = useState(slotsToValues(availability.saturdaySlots));
  const [blockedDates, setBlockedDates] = useState(availability.blockedDates);

  const [state, formAction, pending] = useActionState<
    ConsultationAvailabilityResult | undefined,
    FormData
  >(saveConsultationAvailabilityAction, undefined);

  useAdminActionFeedback(state, pending, {
    loadingMessage: "Saving booking schedule…",
  });

  const disabled = !canEdit || pending;

  return (
    <form action={formAction} className="admin-schedule-form">
      <p className="admin-schedule-intro">
        Controls when customers can book free consultations on{" "}
        <a href="/consultation" target="_blank" className="text-[#2271b1] underline">
          /consultation
        </a>
        . Current schedule: {getOpenDaysSummary(availability)}
      </p>

      <input type="hidden" name="weekdaySlots" value={weekdaySlots.join("\n")} />
      <input type="hidden" name="saturdaySlots" value={saturdaySlots.join("\n")} />
      <input type="hidden" name="blockedDates" value={blockedDates.join("\n")} />

      <fieldset className="admin-schedule-field" disabled={disabled}>
        <legend className="admin-label mb-2">Open days</legend>
        <div className="admin-day-pills">
          {DAY_OPTIONS.map((day) => (
            <label key={day.value} className="admin-day-pill">
              <input
                type="checkbox"
                name={`openDay_${day.value}`}
                defaultChecked={availability.openDays.includes(day.value)}
                className="sr-only"
              />
              <span>{day.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="admin-schedule-grid">
        <AdminTimeSlotPicker
          id="weekday"
          label="Weekday time slots"
          hint="Mon–Fri appointment times shown to customers."
          values={weekdaySlots}
          onChange={setWeekdaySlots}
          disabled={disabled}
          quickPicks={WEEKDAY_QUICK_PICKS}
        />

        <AdminTimeSlotPicker
          id="saturday"
          label="Saturday time slots"
          hint="Separate schedule for Saturdays."
          values={saturdaySlots}
          onChange={setSaturdaySlots}
          disabled={disabled}
          quickPicks={SATURDAY_QUICK_PICKS}
        />

        <AdminBlockedDatesPicker
          id="blocked"
          label="Blocked dates"
          hint="Holidays and closures when consultations cannot be booked."
          values={blockedDates}
          onChange={setBlockedDates}
          disabled={disabled}
        />

        <div className="admin-schedule-rules">
          <div>
            <label htmlFor="minNoticeMinutes" className="admin-label">
              Minimum notice
            </label>
            <select
              id="minNoticeMinutes"
              name="minNoticeMinutes"
              defaultValue={String(availability.minNoticeMinutes)}
              disabled={disabled}
              className="admin-input"
            >
              {NOTICE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="maxAdvanceDays" className="admin-label">
              Book up to
            </label>
            <select
              id="maxAdvanceDays"
              name="maxAdvanceDays"
              defaultValue={String(availability.maxAdvanceDays)}
              disabled={disabled}
              className="admin-input"
            >
              {ADVANCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {canEdit ? (
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : "Save booking schedule"}
        </button>
      ) : null}
    </form>
  );
}
