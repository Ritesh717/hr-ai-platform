import { apiFetch } from "@/lib/api/client";
import { fetchDepartments } from "@/lib/api/departments";

export interface DirectoryEmployee {
  id: string;
  name: string;
  role: string;
  department: string;
  location: string;
  email: string;
  phone: string;
  skills: string[];
}

interface EmployeeListResponseDto {
  items: Array<{
    id: string;
    fullName: string;
    jobTitle: string;
    departmentId: string | null;
    location: string | null;
    email: string;
    status: string;
  }>;
}

export async function fetchDirectoryEmployees(): Promise<DirectoryEmployee[]> {
  const [res, depts] = await Promise.all([
    apiFetch<EmployeeListResponseDto>("/api/v1/employees?limit=200"),
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
      location: e.location ?? "",
      email: e.email,
      phone: "",
      skills: [],
    }));
}
