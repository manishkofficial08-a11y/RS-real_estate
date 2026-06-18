from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid

from app.database.base import Base


class TeamInvitationStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    expired = "expired"
    cancelled = "cancelled"


class TeamInvitation(Base):
    __tablename__ = "team_invitations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    email = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False)
    status = Column(
        String,
        default=TeamInvitationStatus.pending.value,
        nullable=False,
        index=True,
    )
    invited_by_user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    invite_code = Column(String, nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant")
    invited_by_user = relationship("User", foreign_keys=[invited_by_user_id])
