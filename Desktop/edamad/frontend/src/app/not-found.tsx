import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <h2 className="text-xl font-bold text-[#002B7F]">Page not found</h2>
      <p className="mt-2 text-sm text-[#6B7280]">The page you are looking for does not exist.</p>
      <Link href="/dashboard" className="ed-btn-primary mt-6 inline-flex">
        Back to Home
      </Link>
    </div>
  );
}
