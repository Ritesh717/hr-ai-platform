"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  updateDepartment,
} from "@/lib/api/departments";

// Same queryKey as features/employees/api.ts's useDepartments — TanStack Query dedupes/shares
// the cache entry, so either feature invalidating it keeps both in sync.
export function useDepartments() {
  return useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createDepartment(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
}

export function useUpdateDepartment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => updateDepartment(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
