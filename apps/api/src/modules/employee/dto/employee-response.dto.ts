import { EmployeeDocument, EmployeeStatus } from '../schemas/employee.schema';

// Mirrors domain/employee/schemas.py's EmployeeResponse — password never included, role
// relationship flattened into a `role` name string alongside the raw `roleId`.
export class EmployeeResponseDto {
  id: string;
  tenantId: string;
  departmentId: string | null;
  managerId: string | null;
  email: string;
  fullName: string;
  jobTitle: string;
  status: EmployeeStatus;
  hireDate: Date;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  roleId: string;
  role: string;

  static fromEmployee(employee: EmployeeDocument, roleName: string): EmployeeResponseDto {
    return {
      id: employee._id.toString(),
      tenantId: employee.tenantId.toString(),
      departmentId: employee.departmentId ? employee.departmentId.toString() : null,
      managerId: employee.managerId ? employee.managerId.toString() : null,
      email: employee.email,
      fullName: employee.fullName,
      jobTitle: employee.jobTitle,
      status: employee.status,
      hireDate: employee.hireDate,
      location: employee.location,
      createdAt: employee.createdAt as Date,
      updatedAt: employee.updatedAt as Date,
      roleId: employee.roleId.toString(),
      role: roleName,
    };
  }
}

export class EmployeeListResponseDto {
  items: EmployeeResponseDto[];
  total: number;
}
