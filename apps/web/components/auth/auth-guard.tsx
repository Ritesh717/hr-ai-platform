"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { getToken } from "@/lib/auth/token";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/**
 * Client-side route guard. Middleware can't check localStorage, so protection
 * lives here instead — matches the localStorage + Bearer-header auth strategy
 * (see lib/api/client.ts).
 *
 * useSyncExternalStore (not useState+useEffect) because localStorage is
 * external, browser-only state: its getServerSnapshot keeps SSR output
 * consistent with the client's first paint (no token, effectively "signed
 * out") so React doesn't throw a hydration mismatch when the real client
 * value differs from what the server rendered.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasToken = useSyncExternalStore(
    subscribe,
    () => Boolean(getToken()),
    () => false,
  );

  useEffect(() => {
    // Re-check the live token here rather than trusting the `hasToken` that
    // triggered this effect run: on a hard navigation, the first committed
    // render legitimately uses getServerSnapshot's "false" before
    // useSyncExternalStore's post-hydration correction lands, and this effect
    // can fire on that transient render — redirecting a signed-in user back
    // to /login. Reading localStorage directly here is immune to that race.
    if (!getToken()) router.replace("/login");
  }, [hasToken, router]);

  if (!hasToken) return null;
  return <>{children}</>;
}
