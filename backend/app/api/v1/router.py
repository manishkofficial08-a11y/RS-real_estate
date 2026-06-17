from fastapi import APIRouter
from app.api.v1.endpoints import auth, properties, leads, admin, upload, support, notifications, ai_jobs, content_assets

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(properties.router)
api_router.include_router(leads.router)
api_router.include_router(admin.router)
api_router.include_router(upload.router)
api_router.include_router(support.router)
api_router.include_router(notifications.router)
api_router.include_router(ai_jobs.router)
api_router.include_router(content_assets.router)
