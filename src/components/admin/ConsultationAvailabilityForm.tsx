"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import {
  saveConsultationAvailabilityAction,
  type ConsultationAvailabilityResult,
} from "@/app/admin/actions/consultations";
import { AdminNotice } from "@/components/admin/AdminChrome";
import type { ConsultationAvailabilitySettings } from "@/lib/settings-types";
import { getOpenDaysSummary } from "@/lib/consultation-availability";

type Props = {
  availability: ConsultationAvailabilitySettings;
  canEdit: boolean;
};

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function slotsToText(slots: ConsultationAvailabilitySettings["weekdaySlots"]) {
  return slots.map((slot) => slot.value).join("\n");
}

export function ConsultationAvailabilityForm({ availability, canEdit }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    ConsultationAvailabilityResult | undefined,
    FormData
  >(saveConsultationAvailabilityAction, undefined);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [router, state]);

  return (
    <form action={formAction} className="space-y-5">
      {state ? (
        <AdminNotice variant={state.success ? "success" : "error"}>
          {state.success ? state.message : state.error}
        </AdminNotice>
      ) : null}

      <p className="text-[13px] text-[#646970]">
        Controls when customers can book free consultations on{" "}
        <a href="/consultation" target="_blank" className="text-[#2271b1] underline">
          /consultation
        </a>
        . Current schedule: {getOpenDaysSummary(availability)}
      </p>

      <fieldset className="space-y-2" disabled={!canEdit || pending}>
        <legend className="admin-label mb-2">Open days</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {DAY_OPTIONS.map((day) => (
            <label key={day.value} className="flex items-center gap-2 text-[13px] text-[#1d2327]">
              <input
                type="checkbox"
                name={`openDay_${day.value}`}
                defaultChecked={availability.openDays.includes(day.value)}
                className="rounded border-[#8c8f94]"
              />
              {day.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="weekdaySlots" className="admin-label">
          Weekday time slots
        </label>
        <p className="mb-2 text-[12px] text-[#646970]">
          One time per line in 24-hour format (e.g. 09:00, 14:30).
        </p>
        <textarea
          id="weekdaySlots"
          name="weekdaySlots"
          rows={5}
          defaultValue={slotsToText(availability.weekdaySlots)}
          disabled={!canEdit || pending}
          className="admin-input font-mono text-[13px]"
        />
      </div>

      <div>
        <label htmlFor="saturdaySlots" className="admin-label">
          Saturday time slots
        </label>
        <textarea
          id="saturdaySlots"
          name="saturdaySlots"
          rows={4}
          defaultValue={slotsToText(availability.saturdaySlots)}
          disabled={!canEdit || pending}
          className="admin-input font-mono text-[13px]"
        />
      </div>

      <div>
        <label htmlFor="blockedDates" className="admin-label">
          Blocked dates
        </label>
        <p className="mb-2 text-[12px] text-[#646970]">
          Optional. One YYYY-MM-DD date per line (holidays, closures).
        </p>
        <textarea
          id="blockedDates"
          name="blockedDates"
          rows={3}
          defaultValue={availability.blockedDates.join("\n")}
          disabled={!canEdit || pending}
          className="admin-input font-mono text-[13px]"
          placeholder={"2026-12-25\n2026-12-26"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="minNoticeMinutes" className="admin-label">
            Minimum notice (minutes)
          </label>
          <input
            id="minNoticeMinutes"
            name="minNoticeMinutes"
            type="number"
            min={0}
            step={15}
            defaultValue={availability.minNoticeMinutes}
            disabled={!canEdit || pending}
            className="admin-input"
          />
        </div>
        <div>
          <label htmlFor="maxAdvanceDays" className="admin-label">
            Book up to (days ahead)
          </label>
          <input
            id="maxAdvanceDays"
            name="maxAdvanceDays"
            type="number"
            min={1}
            max={90}
            defaultValue={availability.maxAdvanceDays}
            disabled={!canEdit || pending}
            className="admin-input"
          />
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
