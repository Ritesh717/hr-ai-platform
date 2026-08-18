"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEmployee, fetchEmployees, updateEmployee } from "@/lib/api/employees";
import type { Employee } from "@/lib/api/types";

export function useEmployees() {
  return useQuery({ queryKey: ["employees"], queryFn: fetchEmployees });
}

export function useEmployee(id: string) {
  return useQuery({ queryKey: ["employees", id], queryFn: () => fetchEmployee(id) });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Employee>) => updateEmployee(id, patch),
    onSuccess: (employee) => {
      queryClient.setQueryData(["employees", id], employee);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
