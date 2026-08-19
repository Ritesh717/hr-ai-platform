import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from domain.rbac.schemas import (
    PermissionResponse,
    RoleCreate,
    RoleListResponse,
    RoleResponse,
    RoleUpdate,
)
from domain.rbac.service import RoleService
from infrastructure.database.session import get_db
from shared.auth.dependencies import CurrentEmployee, get_current_employee

roles_router = APIRouter(prefix="/api/v1/roles", tags=["roles"])
permissions_router = APIRouter(prefix="/api/v1/permissions", tags=["roles"])


@roles_router.get("", response_model=RoleListResponse)
async def list_roles(
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> RoleListResponse:
    roles = await RoleService(session).list_roles(
        tenant_id=current.tenant_id, actor_permissions=current.permissions
    )
    return RoleListResponse(items=[RoleResponse.from_role(r) for r in roles])


@roles_router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> RoleResponse:
    role = await RoleService(session).get_role(
        role_id, tenant_id=current.tenant_id, actor_permissions=current.permissions
    )
    return RoleResponse.from_role(role)


@roles_router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    payload: RoleCreate,
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> RoleResponse:
    role = await RoleService(session).create_role(
        tenant_id=current.tenant_id,
        actor_permissions=current.permissions,
        name=payload.name,
        description=payload.description,
        permission_codes=payload.permission_codes,
    )
    return RoleResponse.from_role(role)


@roles_router.patch("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: uuid.UUID,
    payload: RoleUpdate,
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> RoleResponse:
    role = await RoleService(session).update_role(
        role_id,
        tenant_id=current.tenant_id,
        actor_permissions=current.permissions,
        name=payload.name,
        description=payload.description,
        permission_codes=payload.permission_codes,
    )
    return RoleResponse.from_role(role)


@roles_router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> None:
    await RoleService(session).delete_role(
        role_id, tenant_id=current.tenant_id, actor_permissions=current.permissions
    )


@permissions_router.get("", response_model=list[PermissionResponse])
async def list_permissions(
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> list[PermissionResponse]:
    permissions = await RoleService(session).list_permission_catalog(
        actor_permissions=current.permissions
    )
    return [PermissionResponse.from_permission(p) for p in permissions]
