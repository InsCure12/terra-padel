"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type AuthMode = "signin" | "signup";

type MeResponse = {
  data: {
    id: string;
    role: "manager" | "player";
  };
};

function isSafeNextPath(path: string | null): string | null {
  if (!path) {
    return null;
  }
  if (!path.startsWith("/")) {
    return null;
  }
  if (path.startsWith("//")) {
    return null;
  }
  return path;
}

type LoginFormProps = {
  onSuccess?: () => void;
  redirectOnSuccess?: boolean;
};

export default function LoginForm({ onSuccess, redirectOnSuccess = true }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(() => isSafeNextPath(searchParams.get("next")), [searchParams]);

  const submitLabel = mode === "signin" ? "Login" : "Create Account";

  async function resolveDestination() {
    const meRes = await fetch("/api/auth/me", { cache: "no-store" });
    if (!meRes.ok) {
      return "/";
    }

    const meJson: MeResponse = await meRes.json();
    if (meJson.data.role === "manager") {
      if (nextPath && nextPath.startsWith("/manager")) {
        return nextPath;
      }
      return "/manager/overview";
    }

    return "/";
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === "signin" ? "/api/auth/sign-in/email" : "/api/auth/sign-up/email";
      const body = mode === "signin" ? { email, password, rememberMe } : { name, email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(json?.message ?? "Authentication failed");
      }

      onSuccess?.();

      if (!redirectOnSuccess) {
        router.refresh();
        return;
      }

      const destination = await resolveDestination();
      router.replace(destination);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-10 text-center lg:text-left">
        <div className="mb-6 flex items-center justify-center lg:justify-start">
          <span className="text-3xl font-bold tracking-tight text-[var(--primary)]">Terra Padel</span>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-[var(--on-surface)]">Welcome back to Terra Padel</h1>
        <p className="text-[var(--secondary)]">Enter your details to access your court side.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {mode === "signup" ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--on-surface-variant)]" htmlFor="name">
              Full Name
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-[var(--outline)]">
                person
              </span>
              <input
                id="name"
                className="w-full rounded-lg border-none bg-[var(--surface-container-low)] py-3 pr-4 pl-12 text-[var(--on-surface)] outline-none transition-all placeholder:text-[var(--outline)]/60 focus:bg-[var(--surface-container-high)] focus:ring-2 focus:ring-[var(--primary)]/20"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Alex Rivera"
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--on-surface-variant)]" htmlFor="email">
            Email Address
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-[var(--outline)]">
              mail
            </span>
            <input
              id="email"
              type="email"
              className="w-full rounded-lg border-none bg-[var(--surface-container-low)] py-3 pr-4 pl-12 text-[var(--on-surface)] outline-none transition-all placeholder:text-[var(--outline)]/60 focus:bg-[var(--surface-container-high)] focus:ring-2 focus:ring-[var(--primary)]/20"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-[var(--on-surface-variant)]" htmlFor="password">
              Password
            </label>
            <a className="text-xs font-semibold text-[var(--primary)] transition-all hover:underline" href="#">
              Forgot Password?
            </a>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-[var(--outline)]">
              lock
            </span>
            <input
              id="password"
              type="password"
              className="w-full rounded-lg border-none bg-[var(--surface-container-low)] py-3 pr-4 pl-12 text-[var(--on-surface)] outline-none transition-all placeholder:text-[var(--outline)]/60 focus:bg-[var(--surface-container-high)] focus:ring-2 focus:ring-[var(--primary)]/20"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-5 w-5 cursor-pointer rounded border-[var(--outline-variant)] bg-[var(--surface)] text-[var(--primary)] transition-all focus:ring-[var(--primary)]"
          />
          <label htmlFor="remember" className="ml-3 cursor-pointer text-sm text-[var(--secondary)]">
            Remember Me
          </label>
        </div>

        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--primary)] py-4 text-lg font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[var(--on-primary-fixed-variant)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Please wait..." : submitLabel}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--outline-variant)]/40" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[var(--surface)] px-4 tracking-widest text-[var(--outline)]">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          className="flex items-center justify-center gap-3 rounded-lg border border-[var(--outline-variant)]/50 px-4 py-3 text-sm text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--surface-container-low)]"
        >
          <img
            alt="Google"
            className="h-5 w-5"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYBWyWqRXxirdiQ-_g8bl8UfRQobdFM0ihLG6bA9Q_5iT2UjRbShcIf3zJqSJy1kMJvhHvZlDJPvkvyKS3-vr5S6SAUcTnJmDYur_3EY1HSNol9mfbuzmdMsdUunMB_zNwIAjkMGEbKVXlGp3Hz3qqgQvQ-qYSXgULdkLD0hfIcFShiXnnScCvXgKd-rX4vaMHFp7oYM34DUjgUBSn9VdvVSg5Mn6W2E0jXJeA0OXomjLKn2YkIQjgnLsM1KrCcLi6UxeiXMvuAK4"
          />
          Google
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-3 rounded-lg border border-[var(--outline-variant)]/50 px-4 py-3 text-sm text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--surface-container-low)]"
        >
          <span className="material-symbols-outlined text-xl [font-variation-settings:'FILL'_1]">ios</span>
          Apple
        </button>
      </div>

      <p className="mt-10 text-center text-[var(--secondary)]">
        {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="ml-1 font-bold text-[var(--primary)] transition-all hover:underline"
        >
          {mode === "signin" ? "Create an Account" : "Sign In"}
        </button>
      </p>
    </div>
  );
}
