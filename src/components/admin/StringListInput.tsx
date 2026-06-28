"use client";

type Props = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
};

export function StringListInput({ label, values, onChange }: Props) {
  return (
    <div>
      <label className="admin-label">{label}</label>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const next = [...values];
                next[index] = e.target.value;
                onChange(next);
              }}
              className="admin-input"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="admin-row-action-delete shrink-0 px-2"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          className="admin-row-action-link"
        >
          + Add item
        </button>
      </div>
    </div>
  );
}
