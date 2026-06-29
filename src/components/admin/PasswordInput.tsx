"use client";

import { useState } from "react";

type Props = {
  id: string;
  name: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
};

function EyeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42M9.9 4.24A10.66 10.66 0 0 1 12 4c6.5 0 10 7 10 7a18.24 18.24 0 0 1-4.07 4.94M6.61 6.61C3.78 8.46 2 12 2 12a18.5 18.5 0 0 0 6.5 5.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PasswordInput({
  id,
  name,
  placeholder = "Enter your password",
  autoComplete = "current-password",
  required = true,
  minLength,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="admin-password-field">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        className="admin-input"
      />
      <button
        type="button"
        className="admin-password-toggle"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
