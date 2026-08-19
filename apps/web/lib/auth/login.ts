import { apiFetch } from "@/lib/api/client";
import { setToken } from "@/lib/auth/token";

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function login(params: {
  tenantSlug: string;
  email: string;
  password: string;
}): Promise<void> {
  const response = await apiFetch<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({
      tenant_slug: params.tenantSlug,
      email: params.email,
      password: params.password,
    }),
  });
  setToken(response.access_token);
}
