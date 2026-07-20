/** Crest mark from iPad WebApp UI.pdf — book, torch, caduceus, wreath */
export function CrestMark({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
      <path
        d="M40 12c-8 6-14 14-14 22 0 4 2 8 6 10v4h16v-4c4-2 6-6 6-10 0-8-6-16-14-22z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M32 48h16v6H32z" fill="currentColor" opacity="0.9" />
      <path d="M36 54h8v4H36z" fill="currentColor" />
      <path
        d="M40 8v6M38 10h4"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="40" cy="10" rx="3" ry="4" fill="#F59E0B" opacity="0.9" />
      <path
        d="M40 32v8M36 36h8M34 40h12"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M22 28c4-6 10-10 18-10s14 4 18 10M22 52c4 6 10 10 18 10s14-4 18-10"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}

export function AuthWatermark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="100" cy="100" r="90" stroke="white" strokeWidth="8" opacity="0.08" />
      <path
        d="M100 30c-20 15-35 35-35 55 0 10 8 20 20 25v10h30v-10c12-5 20-15 20-25 0-20-15-40-35-55z"
        stroke="white"
        strokeWidth="4"
        opacity="0.06"
      />
      <path
        d="M55 70c10-15 25-25 45-25s35 10 45 25M55 130c10 15 25 25 45 25s35-10 45-25"
        stroke="white"
        strokeWidth="3"
        opacity="0.06"
      />
    </svg>
  );
}
