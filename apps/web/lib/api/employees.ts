import { apiFetch } from "@/lib/api/client";
import type { Employee } from "@/lib/api/types";

interface EmployeeDto {
  id: string;
  tenant_id: string;
  department_id: string | null;
  manager_id: string | null;
  email: string;
  full_name: string;
  job_title: string;
  status: Employee["status"];
  hire_date: string;
  location: string | null;
  created_at: string;
  updated_at: string;
  role_id: string;
  role: string;
}

interface EmployeeListResponseDto {
  items: EmployeeDto[];
  total: number;
}

function mapEmployee(dto: EmployeeDto): Employee {
  return {
    id: dto.id,
    tenantId: dto.tenant_id,
    departmentId: dto.department_id,
    managerId: dto.manager_id,
    email: dto.email,
    fullName: dto.full_name,
    jobTitle: dto.job_title,
    status: dto.status,
    hireDate: dto.hire_date,
    location: dto.location,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    roleId: dto.role_id,
    role: dto.role,
  };
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
  if (patch.fullName !== undefined) payload.full_name = patch.fullName;
  if (patch.jobTitle !== undefined) payload.job_title = patch.jobTitle;
  if (patch.departmentId !== undefined) payload.department_id = patch.departmentId || null;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.hireDate !== undefined) payload.hire_date = patch.hireDate.toISOString().slice(0, 10);
  if (patch.location !== undefined) payload.location = patch.location || null;
  return payload;
}

export async function fetchEmployees(): Promise<Employee[]> {
  const response = await apiFetch<EmployeeListResponseDto>("/api/v1/employees");
  return response.items.map(mapEmployee);
}

export async function fetchEmployee(id: string): Promise<Employee> {
  const dto = await apiFetch<EmployeeDto>(`/api/v1/employees/${id}`);
  return mapEmployee(dto);
}

export async function updateEmployee(id: string, patch: EmployeeUpdatePatch): Promise<Employee> {
  const dto = await apiFetch<EmployeeDto>(`/api/v1/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toUpdatePayload(patch)),
  });
  return mapEmployee(dto);
}
