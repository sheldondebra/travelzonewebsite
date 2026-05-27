"use client";

import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPostLoginPath } from "@/lib/auth/redirect";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reset = searchParams.get("reset");
  const registered = searchParams.get("registered");
  const authError = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = (form.get("email") as string).trim().toLowerCase();
    const password = form.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        const message =
          result?.error && result.error !== "CredentialsSignin"
            ? decodeURIComponent(result.error)
            : "Invalid email or password";
        toast.error(message);
        return;
      }

      const session = await getSession();
      if (!session?.user) {
        toast.error("Sign-in succeeded but session was not created. Try again.");
        return;
      }

      const destination = getPostLoginPath(session.user);
      toast.success("Welcome back");
      router.push(searchParams.get("callbackUrl") ?? destination);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full shadow-soft">
      <CardHeader className="sr-only">
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Manage your social commerce business</CardDescription>
      </CardHeader>
      <CardContent>
        {authError && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            Sign in failed. Check your email and password, then try again.
          </p>
        )}
        {reset === "success" && (
          <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
            Password updated. Sign in with your new password.
          </p>
        )}
        {registered === "1" && (
          <p className="mb-4 rounded-xl bg-brand-rose/50 px-4 py-3 text-sm">
            Account created. Sign in to continue.
          </p>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/register" className="text-primary underline">
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
