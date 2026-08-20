import { apiFetch } from "@/lib/api/client";
import type { Department } from "@/lib/api/types";

// Backend serializes DTOs directly (camelCase) — see
// apps/api/src/modules/department/dto/department-response.dto.ts.
export async function fetchDepartments(): Promise<Department[]> {
  return apiFetch<Department[]>("/api/v1/departments?limit=200");
}

export async function fetchDepartment(id: string): Promise<Department> {
  return apiFetch<Department>(`/api/v1/departments/${id}`);
}

export async function createDepartment(name: string): Promise<Department> {
  return apiFetch<Department>("/api/v1/departments", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateDepartment(id: string, name: string): Promise<Department> {
  return apiFetch<Department>(`/api/v1/departments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/departments/${id}`, { method: "DELETE" });
}
