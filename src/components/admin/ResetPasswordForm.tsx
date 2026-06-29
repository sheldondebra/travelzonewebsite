"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import {
  updatePasswordAction,
  type UpdatePasswordActionState,
} from "@/app/admin/actions/auth";
import { PasswordInput } from "@/components/admin/PasswordInput";

export function ResetPasswordForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    UpdatePasswordActionState | undefined,
    FormData
  >(updatePasswordAction, undefined);

  useEffect(() => {
    if (state?.success) {
      router.replace("/admin/login?reset=success");
    }
  }, [router, state]);

  return (
    <div className="admin-login-form">
      <div className="admin-login-form-head">
        <h1 className="admin-login-title">Choose a new password</h1>
        <p className="admin-login-subtitle">
          Enter and confirm your new password below.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {state?.error ? (
          <p className="admin-login-error" role="alert">
            <strong>Error:</strong> {state.error}
          </p>
        ) : null}

        <div>
          <label htmlFor="password" className="admin-label">
            New password
          </label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="admin-label">
            Confirm password
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            minLength={8}
          />
        </div>

        <button type="submit" disabled={pending} className="admin-login-submit">
          {pending ? "Updating…" : "Update password"}
        </button>

        <p className="admin-login-helper text-center">
          <Link href="/admin/login" className="admin-login-forgot-link">
            &larr; Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}
