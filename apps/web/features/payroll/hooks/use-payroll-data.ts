"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPayrollSummary, fetchPayslips } from "@/lib/api/payroll";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export function usePayrollSummary() {
  const { data: currentUser } = useCurrentUser();
  return useQuery({
    queryKey: ["payroll-summary", currentUser?.employeeId],
    queryFn: () => fetchPayrollSummary(currentUser!.employeeId),
    enabled: Boolean(currentUser?.employeeId),
    staleTime: 10 * 60 * 1000,
  });
}

export function usePayslips() {
  const { data: currentUser } = useCurrentUser();
  return useQuery({
    queryKey: ["payslips", currentUser?.employeeId],
    queryFn: () => fetchPayslips(currentUser!.employeeId),
    enabled: Boolean(currentUser?.employeeId),
    staleTime: 10 * 60 * 1000,
  });
}
