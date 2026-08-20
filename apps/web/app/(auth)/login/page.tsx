"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <div className="glass-backdrop flex min-h-dvh w-full items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text">Welcome back</h1>
            <p className="mt-1 text-sm text-text-muted">Sign in to HR Copilot</p>
          </div>
        </div>

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
          </div>
          <Button type="submit" loading={submitting} className="mt-2 w-full">
            Sign in
          </Button>
          <Button type="button" intent="secondary" className="w-full" disabled>
            Continue with SSO
          </Button>
        </form>
      </Card>
    </div>
  );
}
