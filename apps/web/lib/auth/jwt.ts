interface TokenClaims {
  sub: string;
  tenantId: string;
}

/**
 * Reads the JWT payload for display purposes only (e.g. "who am I" for the top bar) —
 * never used for authorization, which stays enforced server-side on every request.
 */
export function decodeToken(token: string): TokenClaims | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = JSON.parse(atob(padded));
    if (typeof json.sub !== "string" || typeof json.tenant_id !== "string") return null;
    return { sub: json.sub, tenantId: json.tenant_id };
  } catch {
    return null;
  }
}
