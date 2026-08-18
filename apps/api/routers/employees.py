import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.dependencies.pagination import PaginationParams, pagination_params
from domain.employee.schemas import EmployeeCreate, EmployeeListResponse, EmployeeResponse, EmployeeUpdate
from domain.employee.service import EmployeeService
from domain.rbac.constants import RoleName
from infrastructure.database.session import get_db
from shared.auth.dependencies import CurrentEmployee, get_current_employee

router = APIRouter(prefix="/api/v1/employees", tags=["employees"])


@router.get("", response_model=EmployeeListResponse)
async def list_employees(
    pagination: PaginationParams = Depends(pagination_params),
    search: str | None = None,
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> EmployeeListResponse:
    items, total = await EmployeeService(session).list_employees(
        tenant_id=current.tenant_id,
        actor_role=RoleName(current.role),
        offset=pagination.offset,
        limit=pagination.limit,
        search=search,
    )
    return EmployeeListResponse(
        items=[EmployeeResponse.from_employee(item) for item in items], total=total
    )


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> EmployeeResponse:
    employee = await EmployeeService(session).get_employee(
        employee_id, tenant_id=current.tenant_id, actor_id=current.id, actor_role=RoleName(current.role)
    )
    return EmployeeResponse.from_employee(employee)


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    payload: EmployeeCreate,
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> EmployeeResponse:
    employee = await EmployeeService(session).create_employee(
        payload, tenant_id=current.tenant_id, actor_id=current.id, actor_role=RoleName(current.role)
    )
    return EmployeeResponse.from_employee(employee)


@router.patch("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: uuid.UUID,
    payload: EmployeeUpdate,
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> EmployeeResponse:
    employee = await EmployeeService(session).update_employee(
        employee_id,
        payload,
        tenant_id=current.tenant_id,
        actor_id=current.id,
        actor_role=RoleName(current.role),
    )
    return EmployeeResponse.from_employee(employee)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> None:
    await EmployeeService(session).delete_employee(
        employee_id, tenant_id=current.tenant_id, actor_id=current.id, actor_role=RoleName(current.role)
    )
