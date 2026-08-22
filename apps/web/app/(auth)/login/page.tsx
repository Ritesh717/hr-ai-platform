"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import { login } from "@/lib/auth/login";

export default function LoginPage() {
  const router = useRouter();
  const push = useToast();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="bg-page flex min-h-dvh w-full items-center justify-center p-4">
      {/* Glass card */}
      <div className="w-full max-w-[420px] rounded-[var(--radius-xl)] border border-glass-border bg-glass-surface p-8 shadow-glass-md backdrop-blur-glass backdrop-saturate-150">

        {/* Wordmark */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glass-sm">
            <Sparkles className="size-5.5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-text">HR Copilot</h1>
            <p className="mt-1 text-sm text-text-muted">Sign in to your workspace</p>
          </div>
        </div>

        {/* SSO — primary action */}
        <Button type="button" intent="primary" className="w-full" disabled>
          Continue with SSO
        </Button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-subtle">or sign in with email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Email + password form */}
        <form
          className="flex flex-col gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setSubmitting(true);
            try {
              await login({
                tenantSlug: String(form.get("tenantSlug") ?? ""),
                email: String(form.get("email") ?? ""),
                password: String(form.get("password") ?? ""),
              });
              router.push("/dashboard");
            } catch (error) {
              const message =
                error instanceof ApiError ? error.message : "Something went wrong. Try again.";
              push({ title: "Sign in failed", description: message, tone: "error" });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tenantSlug">Workspace</Label>
            <Input id="tenantSlug" name="tenantSlug" type="text" placeholder="e.g. acme" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" name="email" type="email" placeholder="you@company.com" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-text-muted hover:text-text transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>
          <Button type="submit" loading={submitting} className="mt-1 w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
