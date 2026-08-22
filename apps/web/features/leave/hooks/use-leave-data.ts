"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchApprovalRisk,
  fetchCoveragePreview,
  fetchLeaveScreenBalances,
  fetchLeaveScreenHistory,
  type LeaveScreenType,
} from "@/lib/api/leave-screen";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export function useLeaveScreenBalances() {
  const { data: currentUser } = useCurrentUser();
  return useQuery({
    queryKey: ["leave-screen-balances", currentUser?.employeeId],
    queryFn: () => fetchLeaveScreenBalances(currentUser!.employeeId),
    enabled: Boolean(currentUser?.employeeId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLeaveScreenHistory() {
  const { data: currentUser } = useCurrentUser();
  return useQuery({
    queryKey: ["leave-screen-history", currentUser?.employeeId],
    queryFn: () => fetchLeaveScreenHistory(currentUser!.employeeId),
    enabled: Boolean(currentUser?.employeeId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCoveragePreview(start: Date | null, end: Date | null) {
  return useQuery({
    queryKey: ["coverage-preview", start?.toISOString(), end?.toISOString()],
    queryFn: () => fetchCoveragePreview(start!, end!),
    enabled: Boolean(start && end),
    staleTime: 2 * 60 * 1000,
  });
}

export function useApprovalRisk(start: Date | null, end: Date | null, type: LeaveScreenType | null) {
  return useQuery({
    queryKey: ["approval-risk", start?.toISOString(), end?.toISOString(), type],
    queryFn: () => fetchApprovalRisk(start!, end!, type!),
    enabled: Boolean(start && end && type),
    staleTime: 2 * 60 * 1000,
  });
}
