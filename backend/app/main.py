"""Update main FastAPI application with authentication."""
from fastapi import FastAPI
from fastapi.middleware.gzip import GZIPMiddleware
from contextlib import asynccontextmanager
from app.config import get_settings
from app.database import init_db, close_db
from app.database.redis import init_redis, close_redis
from app.utils import setup_logging, get_logger
from app.middleware import LoggingMiddleware, setup_cors, app_exception_handler, general_exception_handler
from app.middleware.rbac import RBACMiddleware
from app.common import AppException
from app.auth import auth_router
from app.users import user_router
from app.companies import company_router
from app.admin import admin_router
from app.health import health_router


logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    # Startup
    logger.info("Starting application...")
    
    setup_logging()
    await init_db()
    await init_redis()
    
    logger.info("Application started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    
    await close_db()
    await close_redis()
    
    logger.info("Application shut down successfully")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title=settings.APP_NAME,
        description="Production-ready AI SaaS backend with authentication and RBAC",
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )
    
    # Add middleware
    setup_cors(app)
    app.add_middleware(GZIPMiddleware, minimum_size=1000)
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(RBACMiddleware)
    
    # Add exception handlers
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
    
    # Include routers
    app.include_router(health_router)
    app.include_router(
        auth_router,
        prefix=settings.API_PREFIX,
    )
    app.include_router(
        user_router,
        prefix=settings.API_PREFIX,
    )
    app.include_router(
        company_router,
        prefix=settings.API_PREFIX,
    )
    app.include_router(
        admin_router,
        prefix=settings.API_PREFIX,
    )
    
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "message": "Welcome to AI Growth OS Backend API",
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "health": "/health",
            "features": [
                "Complete Authentication",
                "RBAC",
                "JWT Tokens",
                "Password Reset",
                "Email Verification",
            ],
        }
    
    logger.info("FastAPI application configured successfully")
    
    return app


app = create_app()
