import { apiFetch } from "@/lib/api/client";
import { fetchDepartments } from "@/lib/api/departments";

export interface OrgNode {
  id: string;
  name: string;
  role: string;
  department: string;
  managerId: string | null;
  presence: "online" | "offline";
}

interface EmployeeListResponseDto {
  items: Array<{
    id: string;
    fullName: string;
    jobTitle: string;
    departmentId: string | null;
    managerId: string | null;
    status: string;
  }>;
}

export async function fetchOrgNodes(): Promise<OrgNode[]> {
  const [res, depts] = await Promise.all([
    apiFetch<EmployeeListResponseDto>("/api/v1/employees?limit=500"),
    fetchDepartments(),
  ]);
  const deptMap = new Map(depts.map((d) => [d.id, d.name]));
  return res.items
    .filter((e) => e.status !== "terminated")
    .map((e) => ({
      id: e.id,
      name: e.fullName,
      role: e.jobTitle,
      department: deptMap.get(e.departmentId ?? "") ?? "",
      managerId: e.managerId,
      presence: "offline" as const,
    }));
}
