"use client";

type TravelerStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function TravelerStepper({
  value,
  onChange,
  min = 1,
  max = 20,
}: TravelerStepperProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-medium text-navy">Travelers</p>
        <p className="text-xs text-text-muted">Adults on this booking</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-lg text-navy disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Decrease travelers"
        >
          −
        </button>
        <span className="min-w-[2rem] text-center text-lg font-semibold text-navy">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-lg text-navy disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Increase travelers"
        >
          +
        </button>
      </div>
    </div>
  );
}
