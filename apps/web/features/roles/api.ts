"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRole,
  deleteRole,
  fetchPermissions,
  fetchRoles,
  updateRole,
  type RoleInput,
} from "@/lib/api/roles";

export function useRoles() {
  return useQuery({ queryKey: ["roles"], queryFn: fetchRoles });
}

export function usePermissions() {
  return useQuery({ queryKey: ["permissions"], queryFn: fetchPermissions });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RoleInput) => createRole(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<RoleInput>) => updateRole(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}
