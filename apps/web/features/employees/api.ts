"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDepartments } from "@/lib/api/departments";
import { fetchEmployee, fetchEmployees, updateEmployee, type EmployeeUpdatePatch } from "@/lib/api/employees";

export function useEmployees() {
  return useQuery({ queryKey: ["employees"], queryFn: fetchEmployees });
}

export function useEmployee(id: string) {
  return useQuery({ queryKey: ["employees", id], queryFn: () => fetchEmployee(id) });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: EmployeeUpdatePatch) => updateEmployee(id, patch),
    onSuccess: (employee) => {
      queryClient.setQueryData(["employees", id], employee);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDepartments() {
  return useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });
}
