export type PasswordStrengthLevel = "weak" | "fair" | "good" | "strong";

export type PasswordStrengthResult = {
  score: number;
  level: PasswordStrengthLevel;
  label: string;
  color: string;
  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
};

const levelMeta: Record<PasswordStrengthLevel, { label: string; color: string }> = {
  weak: { label: "Weak", color: "#EF4444" },
  fair: { label: "Fair", color: "#F97316" },
  good: { label: "Good", color: "#0057FF" },
  strong: { label: "Strong", color: "#16A34A" },
};

export function getPasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  let level: PasswordStrengthLevel = "weak";
  if (score >= 5) level = "strong";
  else if (score >= 4) level = "good";
  else if (score >= 2) level = "fair";

  return {
    score,
    level,
    label: levelMeta[level].label,
    color: levelMeta[level].color,
    checks,
  };
}
