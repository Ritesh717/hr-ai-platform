"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/lib/api/auth";
import { fetchEmployee } from "@/lib/api/employees";
import type { PermissionCode } from "@/lib/api/types";
import { decodeToken } from "@/lib/auth/jwt";
import { getToken } from "@/lib/auth/token";

export function useCurrentUser() {
  const token = getToken();
  const claims = token ? decodeToken(token) : null;

  return useQuery({
    queryKey: ["current-user", claims?.sub],
    queryFn: async () => {
      const [employee, me] = await Promise.all([fetchEmployee(claims!.sub), fetchMe()]);
      return {
        employeeId: employee.id,
        name: employee.fullName,
        email: employee.email,
        role: employee.role,
        avatarUrl: null as string | null,
        permissions: new Set<PermissionCode>(me.permissions),
      };
    },
    enabled: Boolean(claims),
  });
}
