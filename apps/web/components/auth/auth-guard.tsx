"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { decodeToken } from "@/lib/auth/jwt";
import { clearToken, getToken } from "@/lib/auth/token";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

// A token can be present but undecodable (corrupted localStorage, a stale/garbage value). Without
// this check, useCurrentUser's query stays permanently disabled (claims is null) and the
// dashboard layout shows its loading skeleton forever instead of ever redirecting to /login.
function hasValidToken(): boolean {
  const token = getToken();
  return Boolean(token) && decodeToken(token!) !== null;
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
    hasValidToken,
    () => false,
  );

  useEffect(() => {
    // Re-check the live token here rather than trusting the `hasToken` that
    // triggered this effect run: on a hard navigation, the first committed
    // render legitimately uses getServerSnapshot's "false" before
    // useSyncExternalStore's post-hydration correction lands, and this effect
    // can fire on that transient render — redirecting a signed-in user back
    // to /login. Reading localStorage directly here is immune to that race.
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (decodeToken(token) === null) {
      clearToken();
      router.replace("/login");
    }
  }, [hasToken, router]);

  if (!hasToken) return null;
  return <>{children}</>;
}
