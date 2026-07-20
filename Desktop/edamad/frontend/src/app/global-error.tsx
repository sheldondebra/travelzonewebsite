"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#F7F9FC] px-6 text-center font-sans">
        <h2 className="text-xl font-bold text-[#002B7F]">Something went wrong</h2>
        <p className="mt-2 text-sm text-[#6B7280]">The application encountered an unexpected error.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-[10px] bg-[#0057FF] px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
