import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminSetupPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="admin-card w-full max-w-lg space-y-5">
        <div>
          <h1 className="heading-serif text-2xl text-navy">Admin setup</h1>
          <p className="mt-2 text-sm text-text-muted">
            The dashboard needs Supabase credentials before staff can sign in.
          </p>
        </div>

        {configured ? (
          <div className="rounded-lg bg-accent-green/10 px-4 py-3 text-sm text-accent-green">
            Supabase environment variables are set. You can proceed to login.
          </div>
        ) : (
          <div className="space-y-4 text-sm text-text-muted">
            <p>
              Create{" "}
              <code className="rounded bg-cream px-1.5 py-0.5 text-navy">
                .env.local
              </code>{" "}
              in the project root and add:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-navy p-4 text-xs text-white">
{`NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`}
            </pre>
            <p>
              Find these in{" "}
              <a
                href="https://supabase.com/dashboard/project/_/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-red hover:underline"
              >
                Supabase → Project Settings → API
              </a>
              . Then restart the dev server with{" "}
              <code className="rounded bg-cream px-1.5 py-0.5 text-navy">
                npm run dev
              </code>
              .
            </p>
            <p>
              After that, run the SQL migrations in{" "}
              <code className="rounded bg-cream px-1.5 py-0.5 text-navy">
                supabase/migrations/
              </code>
              , create an admin user with{" "}
              <code className="rounded bg-cream px-1.5 py-0.5 text-navy">
                app_metadata: {"{ \"role\": \"admin\" }"}
              </code>
              , and run{" "}
              <code className="rounded bg-cream px-1.5 py-0.5 text-navy">
                npm run seed
              </code>
              .
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {configured ? (
            <Link href="/admin/login" className="btn-primary">
              Go to login
            </Link>
          ) : null}
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-parchment bg-white px-7 py-3 text-sm font-semibold text-navy hover:border-brand-red"
          >
            Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
