import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.department.models import Department


class DepartmentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, department_id: uuid.UUID, *, tenant_id: uuid.UUID) -> Department | None:
        stmt = select(Department).where(
            Department.id == department_id, Department.tenant_id == tenant_id
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list(self, *, tenant_id: uuid.UUID, offset: int = 0, limit: int = 50) -> list[Department]:
        stmt = (
            select(Department)
            .where(Department.tenant_id == tenant_id)
            .order_by(Department.name)
            .offset(offset)
            .limit(limit)
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def create(self, *, tenant_id: uuid.UUID, name: str) -> Department:
        department = Department(tenant_id=tenant_id, name=name)
        self.session.add(department)
        await self.session.flush()
        return department

    async def update(self, department: Department, *, name: str | None) -> Department:
        if name is not None:
            department.name = name
        await self.session.flush()
        return department

    async def delete(self, department: Department) -> None:
        await self.session.delete(department)
        await self.session.flush()
