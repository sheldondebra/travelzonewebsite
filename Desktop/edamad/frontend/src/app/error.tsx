"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <h2 className="text-xl font-bold text-[#002B7F]">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-[#6B7280]">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <button type="button" onClick={reset} className="ed-btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
