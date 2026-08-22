"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProfileData } from "@/lib/api/profile";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export function useProfileData() {
  const { data: currentUser } = useCurrentUser();
  return useQuery({
    queryKey: ["profile", currentUser?.employeeId],
    queryFn: () => fetchProfileData(currentUser!.employeeId),
    enabled: Boolean(currentUser?.employeeId),
    staleTime: 10 * 60 * 1000,
  });
}
