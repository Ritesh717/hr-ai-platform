from fastapi import APIRouter

from apps.api.routers.audit_logs import router as audit_logs_router
from apps.api.routers.auth import router as auth_router
from apps.api.routers.departments import router as departments_router
from apps.api.routers.employees import router as employees_router
from apps.api.routers.health import router as health_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(employees_router)
api_router.include_router(departments_router)
api_router.include_router(audit_logs_router)

__all__ = ["api_router"]
