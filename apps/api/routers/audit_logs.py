from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.dependencies.pagination import PaginationParams, pagination_params
from domain.audit_log.schemas import AuditLogListResponse, AuditLogResponse
from domain.audit_log.service import AuditLogService
from domain.rbac.constants import RoleName
from infrastructure.database.session import get_db
from shared.auth.dependencies import CurrentEmployee, get_current_employee

router = APIRouter(prefix="/api/v1/audit-logs", tags=["audit-logs"])


@router.get("", response_model=AuditLogListResponse)
async def list_audit_logs(
    pagination: PaginationParams = Depends(pagination_params),
    session: AsyncSession = Depends(get_db),
    current: CurrentEmployee = Depends(get_current_employee),
) -> AuditLogListResponse:
    items, total = await AuditLogService(session).list_logs(
        tenant_id=current.tenant_id,
        actor_role=RoleName(current.role),
        offset=pagination.offset,
        limit=pagination.limit,
    )
    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(item) for item in items], total=total
    )
