"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  loginAction,
  requestPasswordResetAction,
  type LoginActionState,
} from "@/app/admin/actions/auth";
import { PasswordInput } from "@/components/admin/PasswordInput";

type Mode = "login" | "forgot";

export function LoginForm({ resetSuccess }: { resetSuccess?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loginState, loginActionBound, loginPending] = useActionState<
    LoginActionState | undefined,
    FormData
  >(loginAction, undefined);
  const [resetState, resetActionBound, resetPending] = useActionState(
    requestPasswordResetAction,
    undefined,
  );

  useEffect(() => {
    if (loginState?.success) {
      router.replace("/admin");
      router.refresh();
    }
  }, [loginState, router]);

  if (mode === "forgot") {
    return (
      <div className="admin-login-form">
        <div className="admin-login-form-head">
          <h1 className="admin-login-title">Reset password</h1>
          <p className="admin-login-subtitle">
            Enter your staff email and we&apos;ll send a reset link.
          </p>
        </div>

        <form action={resetActionBound} className="space-y-4">
          {resetState?.error ? (
            <p className="admin-login-error" role="alert">
              <strong>Error:</strong> {resetState.error}
            </p>
          ) : null}

          {resetState?.success ? (
            <p className="admin-login-success" role="status">
              {resetState.success}
            </p>
          ) : null}

          <div>
            <label htmlFor="reset-email" className="admin-label">
              Email address
            </label>
            <input
              id="reset-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              className="admin-input"
            />
          </div>

          <button
            type="submit"
            disabled={resetPending}
            className="admin-login-submit"
          >
            {resetPending ? "Sending link…" : "Send reset link"}
          </button>

          <p className="admin-login-helper text-center">
            <button
              type="button"
              className="admin-login-forgot-link"
              onClick={() => setMode("login")}
            >
              &larr; Back to login
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-login-form">
      <div className="admin-login-form-head">
        <h1 className="admin-login-title">Staff login</h1>
        <p className="admin-login-subtitle">
          Sign in to manage tours, bookings, and content.
        </p>
      </div>

      <form action={loginActionBound} className="space-y-4">
        {resetSuccess ? (
          <p className="admin-login-success" role="status">
            Your password was updated. Sign in with your new password.
          </p>
        ) : null}

        {loginState?.error ? (
          <p className="admin-login-error" role="alert">
            <strong>Error:</strong> {loginState.error}
          </p>
        ) : null}

        <div>
          <label htmlFor="email" className="admin-label">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            className="admin-input"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label htmlFor="password" className="admin-label mb-0">
              Password
            </label>
            <button
              type="button"
              className="admin-login-forgot-link"
              onClick={() => setMode("forgot")}
            >
              Forgot password?
            </button>
          </div>
          <PasswordInput
            id="password"
            name="password"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={loginPending} className="admin-login-submit">
          {loginPending ? "Signing in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
