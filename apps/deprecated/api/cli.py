import argparse
import asyncio
import sys

import uvicorn

from infrastructure.database.session import get_engine, get_sessionmaker
from shared.errors.exceptions import AppError


def _serve() -> None:
    uvicorn.run("apps.deprecated.api.main:app", host="0.0.0.0", port=8000, reload=True)


async def _bootstrap_tenant(args: argparse.Namespace) -> None:
    # Imported here, not at module scope, so `start` (serve mode) doesn't pay the cost
    # of importing the whole domain layer just to run uvicorn. Every domain model module
    # must be imported before any flush, or SQLAlchemy can't resolve cross-domain FKs
    # (e.g. employees.department_id -> departments.id) against Base.metadata — same
    # reason migrations/env.py imports them all before running Alembic.
    from domain.audit_log import models as _audit_log_models  # noqa: F401
    from domain.department import models as _department_models  # noqa: F401
    from domain.employee import models as _employee_models  # noqa: F401
    from domain.rbac import models as _rbac_models  # noqa: F401
    from domain.tenant import models as _tenant_models  # noqa: F401
    from domain.tenant.service import TenantService

    session_factory = get_sessionmaker()
    async with session_factory() as session:
        try:
            tenant, admin = await TenantService(session).bootstrap(
                tenant_name=args.name,
                tenant_slug=args.slug,
                admin_email=args.admin_email,
                admin_password=args.admin_password,
                admin_full_name=args.admin_name,
            )
            await session.commit()
        except AppError as exc:
            await session.rollback()
            print(f"Error: {exc.message}", file=sys.stderr)
            await get_engine().dispose()
            sys.exit(1)

    await get_engine().dispose()
    print(f"Created tenant '{tenant.slug}' ({tenant.id})")
    print(f"HR admin: {admin.email} ({admin.id})")


def main() -> None:
    parser = argparse.ArgumentParser(prog="start")
    subparsers = parser.add_subparsers(dest="command")

    bootstrap_parser = subparsers.add_parser(
        "bootstrap-tenant", help="Create a new tenant and its first HR admin employee"
    )
    bootstrap_parser.add_argument("--name", required=True, help="Tenant display name")
    bootstrap_parser.add_argument("--slug", required=True, help="Tenant URL slug (unique)")
    bootstrap_parser.add_argument("--admin-email", required=True)
    bootstrap_parser.add_argument("--admin-password", required=True)
    bootstrap_parser.add_argument("--admin-name", required=True, help="Admin's full name")

    args = parser.parse_args()

    if args.command == "bootstrap-tenant":
        asyncio.run(_bootstrap_tenant(args))
    else:
        _serve()


if __name__ == "__main__":
    main()
