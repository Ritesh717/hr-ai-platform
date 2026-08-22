"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAttendanceMonth, fetchClockStatus, fetchCurrentWeekTimesheet } from "@/lib/api/time";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export function useClockStatus() {
  const { data: currentUser } = useCurrentUser();
  return useQuery({
    queryKey: ["clock-status", currentUser?.employeeId],
    queryFn: () => fetchClockStatus(currentUser!.employeeId),
    enabled: Boolean(currentUser?.employeeId),
    staleTime: 60 * 1000,
  });
}

export function useCurrentWeekTimesheet() {
  const { data: currentUser } = useCurrentUser();
  return useQuery({
    queryKey: ["timesheet-week", currentUser?.employeeId],
    queryFn: () => fetchCurrentWeekTimesheet(currentUser!.employeeId),
    enabled: Boolean(currentUser?.employeeId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttendanceMonth(year: number, month: number) {
  const { data: currentUser } = useCurrentUser();
  return useQuery({
    queryKey: ["attendance", currentUser?.employeeId, year, month],
    queryFn: () => fetchAttendanceMonth(currentUser!.employeeId, year, month),
    enabled: Boolean(currentUser?.employeeId),
    staleTime: 10 * 60 * 1000,
  });
}
