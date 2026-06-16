from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.tenant import Tenant, BusinessType, PlanType
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.dependencies import get_current_user
from pydantic import BaseModel, EmailStr
import uuid

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
