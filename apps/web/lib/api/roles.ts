import { apiFetch } from "@/lib/api/client";
import type { Permission, PermissionCode, Role } from "@/lib/api/types";

// Backend serializes DTOs directly (camelCase) — see
// apps/api/src/modules/rbac/dto/role-response.dto.ts.
interface RoleListResponseDto {
  items: Role[];
}

export interface RoleInput {
  name: string;
  description?: string;
  permissionCodes: PermissionCode[];
}

export async function fetchRoles(): Promise<Role[]> {
  const response = await apiFetch<RoleListResponseDto>("/api/v1/roles");
  return response.items;
}

export async function fetchPermissions(): Promise<Permission[]> {
  return apiFetch<Permission[]>("/api/v1/permissions");
}

export async function createRole(input: RoleInput): Promise<Role> {
  return apiFetch<Role>("/api/v1/roles", { method: "POST", body: JSON.stringify(input) });
}

export async function updateRole(id: string, input: Partial<RoleInput>): Promise<Role> {
  return apiFetch<Role>(`/api/v1/roles/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deleteRole(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/roles/${id}`, { method: "DELETE" });
}
