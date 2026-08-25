import { clearToken, getToken } from "@/lib/auth/token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ErrorBody {
  error: { code: string; message: string; request_id: string | null };
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  opts: { skipAuthRedirect?: boolean } = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ErrorBody | null;

    // A 401 usually means a live session expired mid-use — bounce to /login. But the login call
    // itself legitimately returns 401 for wrong credentials, and that failure needs to surface as
    // an inline "Sign in failed" toast on the login form, not a silent full-page redirect back to
    // the same form (which is what a `skipAuthRedirect`-less caller would otherwise trigger here).
    if (response.status === 401 && !opts.skipAuthRedirect) {
      clearToken();
      if (typeof window !== "undefined") window.location.href = "/login";
    }

    throw new ApiError(
      response.status,
      body?.error.code ?? "unknown_error",
      body?.error.message ?? `Request failed with status ${response.status}`,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
