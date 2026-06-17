import os
import uuid
from typing import Dict, Set

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/upload", tags=["Upload"])

UPLOAD_DIR = "uploads"
IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
PDF_EXTENSIONS = {"pdf"}
VIDEO_EXTENSIONS = {"mp4", "mov", "webm"}
TEXT_EXTENSIONS = {"txt", "md"}
ALLOWED_ASSET_EXTENSIONS = IMAGE_EXTENSIONS | PDF_EXTENSIONS | VIDEO_EXTENSIONS | TEXT_EXTENSIONS
LEGACY_IMAGE_EXTENSIONS = IMAGE_EXTENSIONS | PDF_EXTENSIONS

MAX_STANDARD_FILE_SIZE = 10 * 1024 * 1024  # 10MB for images, PDFs, and text files
MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024  # 50MB for local-dev MVP video uploads
LEGACY_MAX_FILE_SIZE = 5 * 1024 * 1024  # Preserve legacy /upload/image behavior

MIME_TYPES: Dict[str, str] = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "pdf": "application/pdf",
    "mp4": "video/mp4",
    "mov": "video/quicktime",
    "webm": "video/webm",
    "txt": "text/plain",
    "md": "text/markdown",
}

def get_file_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def infer_asset_type(ext: str) -> str:
    if ext in IMAGE_EXTENSIONS:
        return "image"
    if ext in VIDEO_EXTENSIONS:
        return "video"
    if ext in PDF_EXTENSIONS:
        return "pdf"
    if ext in TEXT_EXTENSIONS:
        return "text"
    return "file"


def max_size_for_extension(ext: str) -> int:
    return MAX_VIDEO_FILE_SIZE if ext in VIDEO_EXTENSIONS else MAX_STANDARD_FILE_SIZE


def allowed_extensions_message(extensions: Set[str]) -> str:
    return ", ".join(sorted(extensions))


async def save_upload_file(
    file: UploadFile,
    *,
    allowed_extensions: Set[str],
    max_file_size: int | None = None,
    legacy_image_response: bool = False,
):
    original_filename = file.filename or "upload"
    ext = get_file_extension(original_filename)
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: {allowed_extensions_message(allowed_extensions)}",
        )

    contents = await file.read()
    limit = max_file_size or max_size_for_extension(ext)
    if len(contents) > limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size is {limit // (1024 * 1024)}MB",
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    mime_type = file.content_type or MIME_TYPES.get(ext) or "application/octet-stream"
    response = {
        "filename": filename,
        "url": f"/uploads/{filename}",
        "size": len(contents),
    }

    if legacy_image_response:
        return response

    return {
        **response,
        "mime_type": mime_type,
        "original_filename": original_filename,
        "asset_type": infer_asset_type(ext),
    }


@router.post("/asset")
async def upload_asset(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    return await save_upload_file(
        file,
        allowed_extensions=ALLOWED_ASSET_EXTENSIONS,
    )

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    return await save_upload_file(
        file,
        allowed_extensions=LEGACY_IMAGE_EXTENSIONS,
        max_file_size=LEGACY_MAX_FILE_SIZE,
        legacy_image_response=True,
    )

@router.delete("/image/{filename}")
async def delete_image(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")

    os.remove(filepath)
    return {"message": "File deleted successfully"}
