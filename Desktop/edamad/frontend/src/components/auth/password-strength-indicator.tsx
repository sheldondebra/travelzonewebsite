import { getPasswordStrength } from "@/lib/password-strength";

type PasswordStrengthIndicatorProps = {
  password: string;
};

const requirements = [
  { key: "length" as const, label: "At least 8 characters" },
  { key: "uppercase" as const, label: "One uppercase letter" },
  { key: "lowercase" as const, label: "One lowercase letter" },
  { key: "number" as const, label: "One number" },
  { key: "special" as const, label: "One special character" },
];

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const filledSegments = strength.level === "weak" ? 1 : strength.level === "fair" ? 2 : strength.level === "good" ? 3 : 4;

  return (
    <div className="rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold text-[#374151]">Password strength</p>
        <p className="text-[12px] font-semibold" style={{ color: strength.color }}>
          {strength.label}
        </p>
      </div>

      <div className="mb-3 flex gap-1.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{
              backgroundColor: index < filledSegments ? strength.color : "#E5E7EB",
            }}
          />
        ))}
      </div>

      <ul className="grid gap-1 sm:grid-cols-2">
        {requirements.map((req) => {
          const met = strength.checks[req.key];
          return (
            <li key={req.key} className="flex items-center gap-1.5 text-[11px]">
              <span
                className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ backgroundColor: met ? "#16A34A" : "#D1D5DB" }}
                aria-hidden
              >
                {met ? "✓" : ""}
              </span>
              <span className={met ? "text-[#374151]" : "text-[#9CA3AF]"}>{req.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
