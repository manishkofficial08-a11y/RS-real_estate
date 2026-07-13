import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.config import settings
from app.services.scheduled_publisher import register_scheduled_publisher_worker


def get_cors_origins() -> list[str]:
    origins: set[str] = set()

    if settings.FRONTEND_URL:
        origins.add(settings.FRONTEND_URL.rstrip("/"))

    extra_origins = os.getenv("BACKEND_CORS_ORIGINS", "")
    for origin in extra_origins.split(","):
        cleaned_origin = origin.strip().rstrip("/")
        if cleaned_origin:
            origins.add(cleaned_origin)

    return sorted(origins)


app = FastAPI(
    title=settings.APP_NAME,
    description="AI Automation SaaS Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_origin_regex=r"^(http://(localhost|127\.0\.0\.1):[0-9]+|https://([a-z0-9-]+\.)?mme-ai\.com)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (uploads)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(api_router)

# Background workers
register_scheduled_publisher_worker(app)


@app.get("/")
async def root():
    return {"message": f"{settings.APP_NAME} is running! 🚀"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
