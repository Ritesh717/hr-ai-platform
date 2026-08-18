import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, EmailStr, Field

from domain.employee.models import EmployeeStatus
from domain.rbac.constants import RoleName

if TYPE_CHECKING:
    from domain.employee.models import Employee


class EmployeeCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    job_title: str
    role: RoleName = RoleName.EMPLOYEE
    department_id: uuid.UUID | None = None
    manager_id: uuid.UUID | None = None
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    hire_date: date
    location: str | None = None


class EmployeeUpdate(BaseModel):
    full_name: str | None = None
    job_title: str | None = None
    role: RoleName | None = None
    department_id: uuid.UUID | None = None
    manager_id: uuid.UUID | None = None
    status: EmployeeStatus | None = None
    hire_date: date | None = None
    location: str | None = None


class EmployeeResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    tenant_id: uuid.UUID
    department_id: uuid.UUID | None
    manager_id: uuid.UUID | None
    email: str
    full_name: str
    job_title: str
    status: EmployeeStatus
    hire_date: date
    location: str | None
    created_at: datetime
    updated_at: datetime
    role: str

    @classmethod
    def from_employee(cls, employee: "Employee") -> "EmployeeResponse":
        return cls(
            id=employee.id,
            tenant_id=employee.tenant_id,
            department_id=employee.department_id,
            manager_id=employee.manager_id,
            email=employee.email,
            full_name=employee.full_name,
            job_title=employee.job_title,
            status=employee.status,
            hire_date=employee.hire_date,
            location=employee.location,
            created_at=employee.created_at,
            updated_at=employee.updated_at,
            role=employee.role.name,
        )


class EmployeeListResponse(BaseModel):
    items: list[EmployeeResponse]
    total: int
