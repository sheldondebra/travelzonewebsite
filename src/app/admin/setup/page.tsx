import Link from "next/link";
import { isDatabaseConfigured } from "@/lib/db/config";

export default function AdminSetupPage() {
  const configured = isDatabaseConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="admin-card w-full max-w-lg space-y-5">
        <div>
          <h1 className="heading-serif text-2xl text-navy">Admin setup</h1>
          <p className="mt-2 text-sm text-text-muted">
            The dashboard needs a PostgreSQL connection before staff can sign in.
          </p>
        </div>

        {configured ? (
          <div className="rounded-lg bg-accent-green/10 px-4 py-3 text-sm text-accent-green">
            Database environment variables are set. Run migrations, create an admin, then log in.
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
{`DATABASE_URL=postgresql://user:password@host:5432/postgres
SESSION_SECRET=your_random_secret_at_least_32_chars`}
            </pre>
            <p>
              Use your Hostinger Postgres public connection string for{" "}
              <code className="rounded bg-cream px-1.5 py-0.5 text-navy">
                DATABASE_URL
              </code>
              , then restart the dev server with{" "}
              <code className="rounded bg-cream px-1.5 py-0.5 text-navy">
                npm run dev
              </code>
              .
            </p>
            <p>
              Then run{" "}
              <code className="rounded bg-cream px-1.5 py-0.5 text-navy">
                npm run bootstrap
              </code>{" "}
              to create tables and seed content, and{" "}
              <code className="rounded bg-cream px-1.5 py-0.5 text-navy">
                npm run create-admin -- you@example.com yourpassword
              </code>{" "}
              to create the first admin user.
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
