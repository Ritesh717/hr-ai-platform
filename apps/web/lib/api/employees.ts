import { apiFetch } from "@/lib/api/client";
import type { Employee } from "@/lib/api/types";

// The backend serializes DTOs directly (camelCase, no aliasing) — see
// apps/api/src/modules/employee/dto/employee-response.dto.ts — so response bodies already match
// the Employee shape exactly, no field-name mapping needed.
interface EmployeeListResponseDto {
  items: Employee[];
  total: number;
}

export interface EmployeeCreateInput {
  email: string;
  password: string;
  fullName: string;
  jobTitle: string;
  roleId: string;
  departmentId?: string;
  managerId?: string;
  status?: Employee["status"];
  hireDate: string; // ISO date (YYYY-MM-DD)
  location?: string;
}

export interface EmployeeUpdatePatch {
  fullName?: string;
  jobTitle?: string;
  departmentId?: string; // "" means no department, mapped to null below
  status?: Employee["status"];
  hireDate?: Date;
  location?: string; // "" means no location, mapped to null below
}

function toUpdatePayload(patch: EmployeeUpdatePatch): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (patch.fullName !== undefined) payload.fullName = patch.fullName;
  if (patch.jobTitle !== undefined) payload.jobTitle = patch.jobTitle;
  if (patch.departmentId !== undefined) payload.departmentId = patch.departmentId || null;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.hireDate !== undefined) payload.hireDate = patch.hireDate.toISOString().slice(0, 10);
  if (patch.location !== undefined) payload.location = patch.location || null;
  return payload;
}

export async function fetchEmployees(): Promise<Employee[]> {
  const response = await apiFetch<EmployeeListResponseDto>("/api/v1/employees?limit=200");
  return response.items;
}

export async function fetchEmployee(id: string): Promise<Employee> {
  return apiFetch<Employee>(`/api/v1/employees/${id}`);
}

export async function createEmployee(input: EmployeeCreateInput): Promise<Employee> {
  return apiFetch<Employee>("/api/v1/employees", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateEmployee(id: string, patch: EmployeeUpdatePatch): Promise<Employee> {
  return apiFetch<Employee>(`/api/v1/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toUpdatePayload(patch)),
  });
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/employees/${id}`, { method: "DELETE" });
}
