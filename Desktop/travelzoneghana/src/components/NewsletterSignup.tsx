"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/app/actions/newsletter";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const result = await subscribeNewsletter(email);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(
        result.alreadySubscribed
          ? "You're already subscribed. We'll keep you posted."
          : "You're subscribed. Look out for travel deals and updates from Travel Zone."
      );
      setEmail("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border-t border-gray-100 bg-cream py-12">
      <div className="section-container">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg">
            <p className="text-sm font-medium text-brand-red">Newsletter</p>
            <h2 className="heading-serif mt-1 text-2xl text-navy lg:text-3xl">
              Get deals & travel updates
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Subscribe for tour packages, visa tips, and seasonal offers from
              Travel Zone Ghana.
            </p>
          </div>

          <div className="w-full lg:max-w-md">
            {success ? (
              <p className="border border-accent-green/20 bg-accent-green/5 px-4 py-3 text-sm text-navy">
                {success}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-red"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary shrink-0 px-6 disabled:opacity-60"
                >
                  {submitting ? "Subscribing..." : "Subscribe"}
                </button>
              </form>
            )}

            {error && (
              <p className="mt-3 text-sm text-brand-red">{error}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
