import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.deprecated.api.middleware import RequestIdMiddleware
from apps.deprecated.api.routers import api_router
from infrastructure.database.session import get_engine
from shared.configuration import get_settings
from shared.errors import register_exception_handlers
from shared.logging import configure_logging, get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    configure_logging(logging.DEBUG if get_settings().debug else logging.INFO)
    logger.info("Starting hr-ai-platform API")
    yield
    logger.info("Shutting down hr-ai-platform API")
    await get_engine().dispose()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="HR AI Agent Platform API",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(api_router)

    return app


app = create_app()
