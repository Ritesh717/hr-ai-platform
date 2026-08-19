import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.deprecated.api.dependencies.pagination import PaginationParams, pagination_params
from domain.department.schemas import DepartmentCreate, DepartmentResponse, DepartmentUpdate
from domain.department.service import DepartmentService
from infrastructure.database.session import get_db
from shared.auth.dependencies import CurrentEmployee, get_current_employee

router = APIRouter(prefix="/api/v1/departments", tags=["departments"])


@router.get("", response_model=list[DepartmentResponse])
async def list_departments(
    pagination: PaginationParams = Depends(pagination_params),
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> list[DepartmentResponse]:
    departments = await DepartmentService(session).list_departments(
        tenant_id=current.tenant_id,
        actor_permissions=current.permissions,
        offset=pagination.offset,
        limit=pagination.limit,
    )
    return [DepartmentResponse.model_validate(d) for d in departments]


@router.get("/{department_id}", response_model=DepartmentResponse)
async def get_department(
    department_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> DepartmentResponse:
    department = await DepartmentService(session).get_department(
        department_id, tenant_id=current.tenant_id, actor_permissions=current.permissions
    )
    return DepartmentResponse.model_validate(department)


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    payload: DepartmentCreate,
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> DepartmentResponse:
    department = await DepartmentService(session).create_department(
        tenant_id=current.tenant_id, actor_permissions=current.permissions, name=payload.name
    )
    return DepartmentResponse.model_validate(department)


@router.patch("/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: uuid.UUID,
    payload: DepartmentUpdate,
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> DepartmentResponse:
    department = await DepartmentService(session).update_department(
        department_id,
        tenant_id=current.tenant_id,
        actor_permissions=current.permissions,
        name=payload.name,
    )
    return DepartmentResponse.model_validate(department)


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> None:
    await DepartmentService(session).delete_department(
        department_id, tenant_id=current.tenant_id, actor_permissions=current.permissions
    )
