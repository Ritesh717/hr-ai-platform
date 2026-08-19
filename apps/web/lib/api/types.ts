/**
 * Mirrors domain/employee/schemas.py::EmployeeResponse (camelCased) — see
 * lib/api/employees.ts for the mapping.
 */
export interface Employee {
  id: string;
  tenantId: string;
  departmentId: string | null;
  managerId: string | null;
  email: string;
  fullName: string;
  jobTitle: string;
  status: "active" | "on_leave" | "terminated";
  hireDate: string; // ISO date
  location: string | null;
  createdAt: string;
  updatedAt: string;
  roleId: string;
  role: string;
}

/** Mirrors domain/department/schemas.py::DepartmentResponse. */
export interface Department {
  id: string;
  tenantId: string;
  name: string;
}
