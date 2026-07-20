import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F9FC] px-4">
      <p className="text-sm font-medium uppercase tracking-widest text-[#0057FF]">Nursing E-Learning</p>
      <h1 className="mt-2 font-serif text-4xl font-bold text-[#002B7F]">ED-AMAD</h1>
      <p className="mt-4 max-w-md text-center text-[#6B7280]">
        Tablet-first courses, practice tests, live classes, and admin tools.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/auth/login" className="ed-btn-primary">Sign in</Link>
        <Link href="/auth/register" className="ed-btn-outline">Create account</Link>
        <Link href="/dashboard" className="ed-btn-outline">Open dashboard</Link>
      </div>
    </div>
  );
}
