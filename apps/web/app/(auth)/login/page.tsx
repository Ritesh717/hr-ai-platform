"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-bg p-4">
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
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitting(true);
            router.push("/dashboard");
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="you@company.com" required defaultValue="carla.sanford@hrai.dev" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" required defaultValue="password" />
          </div>
          <Button type="submit" loading={submitting} className="mt-2 w-full">
            Sign in
          </Button>
          <Button type="button" intent="secondary" className="w-full">
            Continue with SSO
          </Button>
        </form>
      </Card>
    </div>
  );
}
