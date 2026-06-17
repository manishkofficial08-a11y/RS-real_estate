from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.tenant import Tenant, BusinessType, PlanType
from app.models.password_reset_token import PasswordResetToken
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.services.email_service import send_password_reset_email
from app.core.dependencies import get_current_user
from pydantic import BaseModel, EmailStr
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Schemas
class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    business_name: str
    business_type: BusinessType = BusinessType.real_estate

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirmRequest(BaseModel):
    token: str
    password: str

class MessageResponse(BaseModel):
    message: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class ClientProfileResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: str
    tenant_id: str | None = None
    business_name: str | None = None
    business_type: str | None = None
    plan: str | None = None

def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _get_frontend_origin(request: Request) -> str:
    origin = request.headers.get("origin")

    if origin:
        return origin.rstrip("/")

    return "http://localhost:5173"


# Endpoints
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create tenant
    tenant = Tenant(
        id=str(uuid.uuid4()),
        name=data.business_name,
        business_type=data.business_type.value,
        plan=PlanType.free.value
    )
    db.add(tenant)
    await db.flush()

    # Create user
    user = User(
        id=str(uuid.uuid4()),
        email=data.email,
        full_name=data.full_name,
        password_hash=hash_password(data.password),
        role=UserRole.client.value,
        tenant_id=tenant.id
    )
    db.add(user)
    await db.commit()

    # Generate tokens
    access_token = create_access_token({"sub": user.id, "tenant_id": tenant.id})
    refresh_token = create_refresh_token({"sub": user.id})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    access_token = create_access_token({"sub": user.id, "tenant_id": user.tenant_id})
    refresh_token = create_refresh_token({"sub": user.id})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/request-password-reset", response_model=MessageResponse)
async def request_password_reset(
    data: PasswordResetRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    generic_message = "If this email exists, a reset link has been sent."

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        return MessageResponse(message=generic_message)

    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash_reset_token(raw_token)

    reset_token = PasswordResetToken(
        id=str(uuid.uuid4()),
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
    )

    db.add(reset_token)
    await db.commit()

    reset_link = f"{_get_frontend_origin(request)}/reset-password?token={raw_token}"
    await send_password_reset_email(user.email, reset_link)

    return MessageResponse(message=generic_message)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    data: PasswordResetConfirmRequest,
    db: AsyncSession = Depends(get_db),
):
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")

    token_hash = _hash_reset_token(data.token)

    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.is_used == False,
        )
    )
    reset_token = result.scalar_one_or_none()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    now = datetime.now(timezone.utc)
    expires_at = reset_token.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user_result = await db.execute(select(User).where(User.id == reset_token.user_id))
    user = user_result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user.password_hash = hash_password(data.password)
    reset_token.is_used = True
    reset_token.used_at = now

    await db.commit()

    return MessageResponse(message="Password reset successfully. You can now login with your new password.")


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == payload.get("sub")))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token({"sub": user.id, "tenant_id": user.tenant_id})
    refresh_token = create_refresh_token({"sub": user.id})

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=ClientProfileResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    tenant = None

    if current_user.tenant_id:
        result = await db.execute(
            select(Tenant).where(Tenant.id == current_user.tenant_id)
        )
        tenant = result.scalar_one_or_none()

    return ClientProfileResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
        tenant_id=current_user.tenant_id,
        business_name=tenant.name if tenant else None,
        business_type=tenant.business_type if tenant else None,
        plan=tenant.plan if tenant else None,
    )
