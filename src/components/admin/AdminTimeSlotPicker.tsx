"use client";

import { useState } from "react";
import { formatTimeSlotLabel } from "@/lib/consultation-availability";

const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

type Props = {
  id: string;
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  quickPicks?: string[];
};

function sortTimes(values: string[]) {
  return [...values].sort();
}

export function AdminTimeSlotPicker({
  id,
  label,
  hint,
  values,
  onChange,
  disabled = false,
  quickPicks = [],
}: Props) {
  const [draft, setDraft] = useState("09:00");

  function addTime(time: string) {
    if (!TIME_PATTERN.test(time) || values.includes(time)) return;
    onChange(sortTimes([...values, time]));
  }

  function removeTime(time: string) {
    onChange(values.filter((value) => value !== time));
  }

  return (
    <div className="admin-schedule-field">
      <label htmlFor={`${id}-time`} className="admin-label">
        {label}
      </label>
      {hint ? <p className="admin-field-hint mt-0">{hint}</p> : null}

      <div className="admin-time-slots-grid" aria-live="polite">
        {values.length === 0 ? (
          <p className="admin-schedule-empty">No time slots added yet.</p>
        ) : (
          values.map((time) => (
            <button
              key={time}
              type="button"
              disabled={disabled}
              onClick={() => removeTime(time)}
              className="admin-time-slot-chip"
              title="Remove time slot"
            >
              <span>{formatTimeSlotLabel(time)}</span>
              <span className="admin-time-slot-chip-remove" aria-hidden>
                ×
              </span>
            </button>
          ))
        )}
      </div>

      <div className="admin-schedule-add-row">
        <input
          id={`${id}-time`}
          type="time"
          step={900}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={disabled}
          className="admin-input admin-time-input"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => addTime(draft)}
          className="admin-button-secondary"
        >
          Add time
        </button>
      </div>

      {quickPicks.length > 0 ? (
        <div className="admin-quick-picks">
          <span className="admin-quick-picks-label">Quick add:</span>
          {quickPicks.map((time) => (
            <button
              key={time}
              type="button"
              disabled={disabled || values.includes(time)}
              onClick={() => addTime(time)}
              className="admin-quick-pick-btn"
            >
              {formatTimeSlotLabel(time)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
