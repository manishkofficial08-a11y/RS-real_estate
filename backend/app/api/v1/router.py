from fastapi import APIRouter
from app.api.v1.endpoints import admin, auth, leads, properties, support, upload

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(properties.router)
api_router.include_router(leads.router)
api_router.include_router(admin.router)
api_router.include_router(upload.router)
api_router.include_router(support.router)
