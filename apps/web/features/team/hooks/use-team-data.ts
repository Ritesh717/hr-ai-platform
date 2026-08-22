"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTeamAvailability, fetchTeamKPIs, fetchTeamMembers } from "@/lib/api/team";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export function useTeamData() {
  const { data: currentUser } = useCurrentUser();
  const managerId = currentUser?.employeeId ?? "";
  const enabled = Boolean(managerId);

  const kpis = useQuery({
    queryKey: ["team-kpis", managerId],
    queryFn: () => fetchTeamKPIs(managerId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const members = useQuery({
    queryKey: ["team-members", managerId],
    queryFn: () => fetchTeamMembers(managerId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const availability = useQuery({
    queryKey: ["team-availability", managerId],
    queryFn: () => fetchTeamAvailability(managerId),
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  return { kpis, members, availability };
}
