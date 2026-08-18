from enum import StrEnum


class RoleName(StrEnum):
    EMPLOYEE = "employee"
    MANAGER = "manager"
    HR_ADMIN = "hr_admin"


class PermissionCode(StrEnum):
    EMPLOYEE_READ = "employee.read"
    EMPLOYEE_WRITE = "employee.write"
    EMPLOYEE_DELETE = "employee.delete"
    DEPARTMENT_READ = "department.read"
    DEPARTMENT_WRITE = "department.write"
    AUDIT_LOG_READ = "audit_log.read"


ROLE_PERMISSIONS: dict[RoleName, list[PermissionCode]] = {
    RoleName.EMPLOYEE: [PermissionCode.EMPLOYEE_READ, PermissionCode.DEPARTMENT_READ],
    RoleName.MANAGER: [
        PermissionCode.EMPLOYEE_READ,
        PermissionCode.EMPLOYEE_WRITE,
        PermissionCode.DEPARTMENT_READ,
    ],
    RoleName.HR_ADMIN: [
        PermissionCode.EMPLOYEE_READ,
        PermissionCode.EMPLOYEE_WRITE,
        PermissionCode.EMPLOYEE_DELETE,
        PermissionCode.DEPARTMENT_READ,
        PermissionCode.DEPARTMENT_WRITE,
        PermissionCode.AUDIT_LOG_READ,
    ],
}
