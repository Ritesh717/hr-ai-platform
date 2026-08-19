from fastapi import APIRouter

from apps.deprecated.api.routers.audit_logs import router as audit_logs_router
from apps.deprecated.api.routers.auth import router as auth_router
from apps.deprecated.api.routers.departments import router as departments_router
from apps.deprecated.api.routers.employees import router as employees_router
from apps.deprecated.api.routers.health import router as health_router
from apps.deprecated.api.routers.roles import permissions_router, roles_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(employees_router)
api_router.include_router(departments_router)
api_router.include_router(audit_logs_router)
api_router.include_router(roles_router)
api_router.include_router(permissions_router)

__all__ = ["api_router"]
