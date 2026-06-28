"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="admin-login-form space-y-4">
      {state?.error ? (
        <p className="admin-login-error" role="alert">
          <strong>Error:</strong> {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="admin-label">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          className="admin-input"
        />
      </div>

      <div>
        <label htmlFor="password" className="admin-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="admin-input"
        />
      </div>

      <button type="submit" disabled={pending} className="admin-login-submit">
        {pending ? "Signing in…" : "Log In"}
      </button>
    </form>
  );
}
