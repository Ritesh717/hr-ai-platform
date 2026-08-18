import uuid
from collections.abc import Callable

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.session import get_db
from shared.auth.security import decode_access_token
from shared.errors import AuthenticationError, AuthorizationError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


class CurrentEmployee:
    """Lightweight principal derived from the JWT — enough for authorization checks
    without a DB round trip on every request. Handlers that need the full Employee
    record still load it explicitly via the employee service."""

    def __init__(self, employee_id: uuid.UUID, tenant_id: uuid.UUID, role: str) -> None:
        self.id = employee_id
        self.tenant_id = tenant_id
        self.role = role


async def get_current_employee(
    token: str | None = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_db),
) -> CurrentEmployee:
    if not token:
        raise AuthenticationError("Not authenticated")

    payload = decode_access_token(token)
    try:
        employee_id = uuid.UUID(payload["sub"])
        tenant_id = uuid.UUID(payload["tenant_id"])
        role = payload["role"]
    except (KeyError, ValueError) as exc:
        raise AuthenticationError("Malformed token") from exc

    # Import here (not at module scope) to avoid a shared.auth <-> domain.employee cycle.
    from domain.employee.models import EmployeeStatus
    from domain.employee.repository import EmployeeRepository

    employee = await EmployeeRepository(session).get_by_id(employee_id, tenant_id=tenant_id)
    if employee is None or employee.status == EmployeeStatus.TERMINATED:
        raise AuthenticationError("Account is no longer active")

    return CurrentEmployee(employee_id=employee.id, tenant_id=employee.tenant_id, role=role)


def require_roles(*allowed_roles: str) -> Callable[[CurrentEmployee], CurrentEmployee]:
    def _check(current: CurrentEmployee = Depends(get_current_employee)) -> CurrentEmployee:
        if current.role not in allowed_roles:
            raise AuthorizationError(f"Role '{current.role}' cannot access this resource")
        return current

    return _check
