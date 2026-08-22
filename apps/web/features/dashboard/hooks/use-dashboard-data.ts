"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "@/lib/api/dashboard";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export function useDashboardData() {
  const { data: currentUser } = useCurrentUser();

  return useQuery({
    queryKey: ["dashboard", currentUser?.employeeId],
    queryFn: () => fetchDashboardData(currentUser!.employeeId),
    enabled: Boolean(currentUser?.employeeId),
    staleTime: 5 * 60 * 1000,
  });
}
