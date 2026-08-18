import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.audit_log.service import AuditLogService
from domain.employee.models import Employee, EmployeeStatus
from domain.employee.repository import EmployeeRepository
from domain.employee.schemas import EmployeeCreate, EmployeeUpdate
from domain.rbac.constants import ROLE_PERMISSIONS, PermissionCode, RoleName
from domain.rbac.models import Role
from shared.auth.security import hash_password, verify_password
from shared.errors import AuthenticationError, AuthorizationError, ConflictError, NotFoundError

PRIVILEGED_UPDATE_FIELDS = {"role", "status", "department_id", "manager_id"}


def _has_permission(role: RoleName, permission: PermissionCode) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, [])


class EmployeeService:
    """Business operations for employees, including the authorization rules from
    blueprint §22 (Employee: own profile; Manager/HR Admin: broader access)."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = EmployeeRepository(session)
        self.audit_log = AuditLogService(session)

    async def _get_role(self, name: RoleName) -> Role:
        stmt = select(Role).where(Role.name == name.value)
        role = (await self.session.execute(stmt)).scalar_one_or_none()
        if role is None:
            raise NotFoundError(f"Role '{name}' is not seeded for this environment")
        return role

    async def authenticate(self, *, tenant_id: uuid.UUID, email: str, password: str) -> Employee:
        employee = await self.repository.get_by_email(email, tenant_id=tenant_id)
        if employee is None or not verify_password(password, employee.hashed_password):
            raise AuthenticationError("Invalid email or password")
        if employee.status == EmployeeStatus.TERMINATED:
            raise AuthenticationError("This account is no longer active")
        return employee

    async def list_employees(
        self,
        *,
        tenant_id: uuid.UUID,
        actor_role: RoleName,
        offset: int = 0,
        limit: int = 50,
        search: str | None = None,
    ) -> tuple[list[Employee], int]:
        if not _has_permission(actor_role, PermissionCode.EMPLOYEE_READ):
            raise AuthorizationError("Not permitted to list employees")
        return await self.repository.list(tenant_id=tenant_id, offset=offset, limit=limit, search=search)

    async def get_employee(
        self, employee_id: uuid.UUID, *, tenant_id: uuid.UUID, actor_id: uuid.UUID, actor_role: RoleName
    ) -> Employee:
        if employee_id != actor_id and not _has_permission(actor_role, PermissionCode.EMPLOYEE_READ):
            raise AuthorizationError("Not permitted to view this employee")
        employee = await self.repository.get_by_id(employee_id, tenant_id=tenant_id)
        if employee is None:
            raise NotFoundError(f"Employee {employee_id} not found")
        return employee

    async def create_employee(
        self,
        payload: EmployeeCreate,
        *,
        tenant_id: uuid.UUID,
        actor_id: uuid.UUID | None,
        actor_role: RoleName,
    ) -> Employee:
        if not _has_permission(actor_role, PermissionCode.EMPLOYEE_WRITE):
            raise AuthorizationError("Not permitted to create employees")

        existing = await self.repository.get_by_email(payload.email, tenant_id=tenant_id)
        if existing is not None:
            raise ConflictError(f"An employee with email {payload.email} already exists")

        role = await self._get_role(payload.role)
        employee = Employee(
            tenant_id=tenant_id,
            department_id=payload.department_id,
            manager_id=payload.manager_id,
            role_id=role.id,
            email=payload.email,
            hashed_password=hash_password(payload.password),
            full_name=payload.full_name,
            job_title=payload.job_title,
            status=payload.status,
            hire_date=payload.hire_date,
            location=payload.location,
        )
        employee = await self.repository.create(employee)
        await self.audit_log.log(
            tenant_id=tenant_id,
            actor_employee_id=actor_id,
            action="employee.created",
            resource_type="employee",
            resource_id=str(employee.id),
        )
        return employee

    async def update_employee(
        self,
        employee_id: uuid.UUID,
        payload: EmployeeUpdate,
        *,
        tenant_id: uuid.UUID,
        actor_id: uuid.UUID,
        actor_role: RoleName,
    ) -> Employee:
        is_self = employee_id == actor_id
        can_write = _has_permission(actor_role, PermissionCode.EMPLOYEE_WRITE)
        if not is_self and not can_write:
            raise AuthorizationError("Not permitted to update this employee")

        updates = payload.model_dump(exclude_unset=True)
        if is_self and not can_write and PRIVILEGED_UPDATE_FIELDS & updates.keys():
            raise AuthorizationError(
                f"Not permitted to change {', '.join(PRIVILEGED_UPDATE_FIELDS & updates.keys())}"
            )

        employee = await self.repository.get_by_id(employee_id, tenant_id=tenant_id)
        if employee is None:
            raise NotFoundError(f"Employee {employee_id} not found")

        if "role" in updates:
            role_name = updates.pop("role")
            employee.role_id = (await self._get_role(role_name)).id
        for field, value in updates.items():
            setattr(employee, field, value)

        employee = await self.repository.update(employee)
        await self.audit_log.log(
            tenant_id=tenant_id,
            actor_employee_id=actor_id,
            action="employee.updated",
            resource_type="employee",
            resource_id=str(employee.id),
            extra={"fields": list(updates.keys())},
        )
        return employee

    async def delete_employee(
        self,
        employee_id: uuid.UUID,
        *,
        tenant_id: uuid.UUID,
        actor_id: uuid.UUID | None,
        actor_role: RoleName,
    ) -> None:
        if not _has_permission(actor_role, PermissionCode.EMPLOYEE_DELETE):
            raise AuthorizationError("Not permitted to delete employees")
        employee = await self.repository.get_by_id(employee_id, tenant_id=tenant_id)
        if employee is None:
            raise NotFoundError(f"Employee {employee_id} not found")
        await self.repository.delete(employee)
        await self.audit_log.log(
            tenant_id=tenant_id,
            actor_employee_id=actor_id,
            action="employee.deleted",
            resource_type="employee",
            resource_id=str(employee_id),
        )
