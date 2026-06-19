from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid

from app.database.base import Base


class SocialPlatform(str, enum.Enum):
    youtube = "youtube"
    instagram = "instagram"
    facebook = "facebook"
    linkedin = "linkedin"


class SocialAccountStatus(str, enum.Enum):
    connected = "connected"
    disconnected = "disconnected"
    expired = "expired"
    error = "error"


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    created_by_user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)

    platform = Column(String, nullable=False, index=True)
    account_name = Column(String, nullable=False)
    external_account_id = Column(String, nullable=True, index=True)

    status = Column(String, default=SocialAccountStatus.connected.value, index=True)
    scopes = Column(JSON, default=list)

    access_token_encrypted = Column(Text, nullable=True)
    refresh_token_encrypted = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)

    last_connected_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)

    metadata_json = Column(JSON, default=dict)

    is_active = Column(Boolean, default=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant")
    created_by_user = relationship("User")

    __table_args__ = (
        Index("ix_social_accounts_tenant_platform_active", "tenant_id", "platform", "is_active"),
    )
