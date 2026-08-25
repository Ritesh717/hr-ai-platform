import { apiFetch } from "@/lib/api/client";
import { setToken } from "@/lib/auth/token";

interface LoginResponse {
  accessToken: string;
  tokenType: string;
}

export async function login(params: {
  tenantSlug: string;
  email: string;
  password: string;
}): Promise<void> {
  const response = await apiFetch<LoginResponse>(
    "/api/v1/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        tenantSlug: params.tenantSlug,
        email: params.email,
        password: params.password,
      }),
    },
    { skipAuthRedirect: true },
  );
  setToken(response.accessToken);
}
