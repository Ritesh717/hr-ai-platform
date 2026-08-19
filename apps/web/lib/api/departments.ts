import { apiFetch } from "@/lib/api/client";
import type { Department } from "@/lib/api/types";

interface DepartmentDto {
  id: string;
  tenant_id: string;
  name: string;
}

function mapDepartment(dto: DepartmentDto): Department {
  return { id: dto.id, tenantId: dto.tenant_id, name: dto.name };
}

export async function fetchDepartments(): Promise<Department[]> {
  const response = await apiFetch<DepartmentDto[]>("/api/v1/departments");
  return response.map(mapDepartment);
}
