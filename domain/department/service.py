import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from domain.department.models import Department
from domain.department.repository import DepartmentRepository
from domain.rbac.constants import ROLE_PERMISSIONS, PermissionCode, RoleName
from shared.errors import AuthorizationError, NotFoundError


def _require_permission(role: RoleName, permission: PermissionCode) -> None:
    if permission not in ROLE_PERMISSIONS.get(role, []):
        raise AuthorizationError(f"Role '{role}' does not have permission '{permission}'")


class DepartmentService:
    """Business operations for departments. Authorization lives here, not in the router
    (blueprint §3.2) — the router only wires HTTP concerns to these methods."""

    def __init__(self, session: AsyncSession) -> None:
        self.repository = DepartmentRepository(session)

    async def list_departments(
        self, *, tenant_id: uuid.UUID, actor_role: RoleName, offset: int = 0, limit: int = 50
    ) -> list[Department]:
        _require_permission(actor_role, PermissionCode.DEPARTMENT_READ)
        return await self.repository.list(tenant_id=tenant_id, offset=offset, limit=limit)

    async def get_department(
        self, department_id: uuid.UUID, *, tenant_id: uuid.UUID, actor_role: RoleName
    ) -> Department:
        _require_permission(actor_role, PermissionCode.DEPARTMENT_READ)
        department = await self.repository.get_by_id(department_id, tenant_id=tenant_id)
        if department is None:
            raise NotFoundError(f"Department {department_id} not found")
        return department

    async def create_department(
        self, *, tenant_id: uuid.UUID, actor_role: RoleName, name: str
    ) -> Department:
        _require_permission(actor_role, PermissionCode.DEPARTMENT_WRITE)
        return await self.repository.create(tenant_id=tenant_id, name=name)

    async def update_department(
        self,
        department_id: uuid.UUID,
        *,
        tenant_id: uuid.UUID,
        actor_role: RoleName,
        name: str | None,
    ) -> Department:
        _require_permission(actor_role, PermissionCode.DEPARTMENT_WRITE)
        department = await self.get_department(
            department_id, tenant_id=tenant_id, actor_role=actor_role
        )
        return await self.repository.update(department, name=name)

    async def delete_department(
        self, department_id: uuid.UUID, *, tenant_id: uuid.UUID, actor_role: RoleName
    ) -> None:
        _require_permission(actor_role, PermissionCode.DEPARTMENT_WRITE)
        department = await self.get_department(
            department_id, tenant_id=tenant_id, actor_role=actor_role
        )
        await self.repository.delete(department)
