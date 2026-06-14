from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.database.base import Base


class BusinessType(str, enum.Enum):
    real_estate = "real_estate"
    retail = "retail"
    healthcare = "healthcare"
    other = "other"


class PlanType(str, enum.Enum):
    free = "free"
    pro = "pro"
    enterprise = "enterprise"


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    business_type = Column(String, default=BusinessType.real_estate.value)
    plan = Column(String, default=PlanType.free.value)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    users = relationship("User", back_populates="tenant")
    properties = relationship("Property", back_populates="tenant")
    leads = relationship("Lead", back_populates="tenant")