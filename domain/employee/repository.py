import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.employee.models import Employee


class EmployeeRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, employee_id: uuid.UUID, *, tenant_id: uuid.UUID) -> Employee | None:
        stmt = select(Employee).where(Employee.id == employee_id, Employee.tenant_id == tenant_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_by_id_any_tenant(self, employee_id: uuid.UUID) -> Employee | None:
        """Used only by the auth dependency, which resolves the tenant from the token itself."""
        stmt = select(Employee).where(Employee.id == employee_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def get_by_email(self, email: str, *, tenant_id: uuid.UUID) -> Employee | None:
        stmt = select(Employee).where(Employee.email == email, Employee.tenant_id == tenant_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list(
        self, *, tenant_id: uuid.UUID, offset: int = 0, limit: int = 50, search: str | None = None
    ) -> tuple[list[Employee], int]:
        stmt = select(Employee).where(Employee.tenant_id == tenant_id)
        count_stmt = select(func.count()).select_from(Employee).where(Employee.tenant_id == tenant_id)

        if search:
            pattern = f"%{search.lower()}%"
            condition = func.lower(Employee.full_name).like(pattern) | func.lower(
                Employee.job_title
            ).like(pattern)
            stmt = stmt.where(condition)
            count_stmt = count_stmt.where(condition)

        stmt = stmt.order_by(Employee.full_name).offset(offset).limit(limit)

        items = list((await self.session.execute(stmt)).scalars().all())
        total = (await self.session.execute(count_stmt)).scalar_one()
        return items, total

    async def create(self, employee: Employee) -> Employee:
        self.session.add(employee)
        await self.session.flush()
        await self.session.refresh(employee, attribute_names=["role"])
        return employee

    async def update(self, employee: Employee) -> Employee:
        await self.session.flush()
        await self.session.refresh(employee, attribute_names=["role"])
        return employee

    async def delete(self, employee: Employee) -> None:
        await self.session.delete(employee)
        await self.session.flush()
