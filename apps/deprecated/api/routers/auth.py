from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from domain.employee.service import EmployeeService
from domain.tenant.repository import TenantRepository
from infrastructure.database.session import get_db
from shared.auth.security import create_access_token
from shared.errors import AuthenticationError

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class LoginRequest(BaseModel):
    tenant_slug: str
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_db)) -> TokenResponse:
    tenant = await TenantRepository(session).get_by_slug(payload.tenant_slug)
    if tenant is None:
        raise AuthenticationError("Invalid email or password")

    employee = await EmployeeService(session).authenticate(
        tenant_id=tenant.id, email=payload.email, password=payload.password
    )
    token = create_access_token(
        employee_id=employee.id, tenant_id=tenant.id, role_id=employee.role_id
    )
    return TokenResponse(access_token=token)
