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
  updateLeaveRequest,
  updateLeaveStatus,
  type LeaveRequestCreateInput,
  type LeaveRequestUpdateInput,
} from "@/lib/api/leave";
import type { LeaveStatus } from "@/lib/api/types";

export function useLeaveRequests() {
  return useQuery({ queryKey: ["leave-requests"], queryFn: () => fetchLeaveRequests() });
}

export function useLeaveBalance() {
  return useQuery({ queryKey: ["leave-balance"], queryFn: () => fetchLeaveBalance() });
}

export function useTeamLeave(statuses?: LeaveStatus[]) {
  return useQuery({
    queryKey: ["leave-team", statuses ? [...statuses].sort((a, b) => a.localeCompare(b)).join(",") : "approved"],
    queryFn: () => fetchTeamLeave(statuses),
  });
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
    mutationFn: ({ id, status, comment }: { id: string; status: LeaveStatus; comment?: string }) =>
      updateLeaveStatus(id, status, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      queryClient.invalidateQueries({ queryKey: ["leave-team"] });
    },
  });
}

export function useUpdateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LeaveRequestUpdateInput }) => updateLeaveRequest(id, input),
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
