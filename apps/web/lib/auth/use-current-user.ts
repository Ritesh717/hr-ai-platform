"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchEmployee } from "@/lib/api/employees";
import { decodeToken } from "@/lib/auth/jwt";
import { getToken } from "@/lib/auth/token";

export function useCurrentUser() {
  const token = getToken();
  const claims = token ? decodeToken(token) : null;

  return useQuery({
    queryKey: ["current-user", claims?.sub],
    queryFn: async () => {
      const employee = await fetchEmployee(claims!.sub);
      return { name: employee.fullName, role: employee.role, avatarUrl: null as string | null };
    },
    enabled: Boolean(claims),
  });
}
