"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createHoliday,
  createLeaveRequest,
  deleteHoliday,
  fetchHolidays,
  fetchLeaveBalance,
  fetchLeaveRequests,
  fetchTeamLeave,
  updateLeaveStatus,
  type LeaveRequestCreateInput,
} from "@/lib/api/leave";
import type { LeaveStatus } from "@/lib/api/types";

export function useLeaveRequests() {
  return useQuery({ queryKey: ["leave-requests"], queryFn: () => fetchLeaveRequests() });
}

export function useLeaveBalance() {
  return useQuery({ queryKey: ["leave-balance"], queryFn: () => fetchLeaveBalance() });
}

export function useTeamLeave(status?: LeaveStatus) {
  return useQuery({ queryKey: ["leave-team", status ?? "approved"], queryFn: () => fetchTeamLeave(status) });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LeaveRequestCreateInput) => createLeaveRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
    },
  });
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeaveStatus }) => updateLeaveStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      queryClient.invalidateQueries({ queryKey: ["leave-team"] });
    },
  });
}

export function useHolidays() {
  return useQuery({ queryKey: ["holidays"], queryFn: fetchHolidays });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; date: string }) => createHoliday(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHoliday(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["holidays"] }),
  });
}
