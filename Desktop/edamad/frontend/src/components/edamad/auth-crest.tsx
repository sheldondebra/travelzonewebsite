/**
 * Brand crest + watermark matching iPad WebApp UI-1 (login PDF).
 */

export function AuthCrestEmblem({ className = "h-[110px] w-[110px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Laurel wreath */}
      <ellipse cx="60" cy="72" rx="48" ry="52" stroke="white" strokeWidth="2" fill="none" />
      <path
        d="M60 22c-16 10-26 24-26 38M60 22c16 10 26 24 26 38M32 48c-8 14-10 30-6 44M88 48c8 14 10 30 6 44M24 72c4 14 12 26 24 34M96 72c-4 14-12 26-24 34"
        stroke="white"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Torch flame */}
      <path
        d="M60 26c-3 6-8 12-8 20 0 5 3.5 9 8 9s8-4 8-9c0-8-5-14-8-20z"
        fill="#F59E0B"
      />
      <path
        d="M58 24c2-2 4-2 6 0 2 4 2 8 0 10-2 2-4 2-6 0-2-2-2-6 0-8z"
        fill="#FBBF24"
        opacity="0.9"
      />
      {/* Open book */}
      <path d="M40 58h40v10H40z" fill="white" />
      <path d="M44 52h32v8H44z" fill="white" />
      <path d="M60 52v18" stroke="white" strokeWidth="1.2" opacity="0.5" />
      <path
        d="M46 54c8-3 18-3 26 0M46 62c8 3 18 3 26 0"
        stroke="white"
        strokeWidth="1"
        fill="none"
      />
      {/* Caduceus */}
      <path d="M60 70v22" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M48 76c6-6 18-6 24 0M48 84c6 6 18 6 24 0"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
      />
      <path d="M44 80h6M70 80h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="44" cy="80" r="2.5" fill="white" />
      <circle cx="76" cy="80" r="2.5" fill="white" />
    </svg>
  );
}

/** Large faint wreath watermark on navy panel */
export function AuthLaurelWatermark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 280"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="140" cy="140" rx="118" ry="128" stroke="white" strokeWidth="5" opacity="0.08" />
      <ellipse cx="140" cy="140" rx="92" ry="100" stroke="white" strokeWidth="3" opacity="0.06" />
      <path
        d="M140 32c-32 18-50 46-50 74M140 32c32 18 50 46 50 74M64 84c-14 24-18 52-10 78M216 84c14 24 18 52 10 78"
        stroke="white"
        strokeWidth="4"
        opacity="0.07"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M110 108h60v28h-60z" stroke="white" strokeWidth="2.5" opacity="0.06" fill="none" />
      <path d="M140 88v58" stroke="white" strokeWidth="2.5" opacity="0.06" />
    </svg>
  );
}
