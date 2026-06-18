from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.database.base import Base


class UserRole(str, enum.Enum):
    superadmin = "superadmin"
    owner = "owner"
    admin = "admin"
    marketer = "marketer"
    sales = "sales"
    viewer = "viewer"
    # Legacy values kept for compatibility with databases that have not migrated yet.
    client = "client"
    staff = "staff"


class ClientTeamRole(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    marketer = "marketer"
    sales = "sales"
    viewer = "viewer"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default=UserRole.owner.value)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="users")
    properties = relationship("Property", back_populates="created_by_user")
    leads = relationship("Lead", back_populates="assigned_to_user")
