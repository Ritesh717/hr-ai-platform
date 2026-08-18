import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.audit_log.models import AuditLog
from domain.rbac.constants import ROLE_PERMISSIONS, PermissionCode, RoleName
from shared.errors import AuthorizationError


class AuditLogService:
    """Write-mostly log used by other services (blueprint §35); read access is
    HR-admin-only via list_logs, used by the Audit Log Viewer screen."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def log(
        self,
        *,
        tenant_id: uuid.UUID,
        actor_employee_id: uuid.UUID | None,
        action: str,
        resource_type: str,
        resource_id: str,
        extra: dict | None = None,
    ) -> None:
        entry = AuditLog(
            tenant_id=tenant_id,
            actor_employee_id=actor_employee_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            extra=extra,
        )
        self.session.add(entry)
        await self.session.flush()

    async def list_logs(
        self,
        *,
        tenant_id: uuid.UUID,
        actor_role: RoleName,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[AuditLog], int]:
        if PermissionCode.AUDIT_LOG_READ not in ROLE_PERMISSIONS.get(actor_role, []):
            raise AuthorizationError("Not permitted to view audit logs")

        stmt = (
            select(AuditLog)
            .where(AuditLog.tenant_id == tenant_id)
            .order_by(AuditLog.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        count_stmt = select(func.count()).select_from(AuditLog).where(AuditLog.tenant_id == tenant_id)

        items = list((await self.session.execute(stmt)).scalars().all())
        total = (await self.session.execute(count_stmt)).scalar_one()
        return items, total
