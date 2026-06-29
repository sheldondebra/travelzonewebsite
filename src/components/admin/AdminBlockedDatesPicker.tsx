"use client";

import { useState } from "react";
import { formatShortDate } from "@/lib/date-utils";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type Props = {
  id: string;
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
};

function sortDates(values: string[]) {
  return [...values].sort();
}

export function AdminBlockedDatesPicker({
  id,
  label,
  hint,
  values,
  onChange,
  disabled = false,
}: Props) {
  const [draft, setDraft] = useState("");

  function addDate(iso: string) {
    if (!ISO_DATE_PATTERN.test(iso) || values.includes(iso)) return;
    onChange(sortDates([...values, iso]));
    setDraft("");
  }

  function removeDate(iso: string) {
    onChange(values.filter((value) => value !== iso));
  }

  return (
    <div className="admin-schedule-field">
      <label htmlFor={`${id}-date`} className="admin-label">
        {label}
      </label>
      {hint ? <p className="admin-field-hint mt-0">{hint}</p> : null}

      <div className="admin-blocked-dates-grid" aria-live="polite">
        {values.length === 0 ? (
          <p className="admin-schedule-empty">No blocked dates. All open days stay bookable.</p>
        ) : (
          values.map((iso) => (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => removeDate(iso)}
              className="admin-blocked-date-chip"
              title="Remove blocked date"
            >
              <span>{formatShortDate(iso)}</span>
              <span className="admin-time-slot-chip-remove" aria-hidden>
                ×
              </span>
            </button>
          ))
        )}
      </div>

      <div className="admin-schedule-add-row">
        <input
          id={`${id}-date`}
          type="date"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={disabled}
          className="admin-input admin-date-input"
        />
        <button
          type="button"
          disabled={disabled || !draft}
          onClick={() => addDate(draft)}
          className="admin-button-secondary"
        >
          Block date
        </button>
      </div>
    </div>
  );
}
