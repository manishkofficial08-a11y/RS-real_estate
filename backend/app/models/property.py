from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.database.base import Base


class PropertyType(str, enum.Enum):
    apartment = "apartment"
    house = "house"
    villa = "villa"
    plot = "plot"
    commercial = "commercial"


class PropertyStatus(str, enum.Enum):
    available = "available"
    sold = "sold"
    rented = "rented"


class Property(Base):
    __tablename__ = "properties"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)

    title = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    location = Column(String, nullable=False)

    property_type = Column(String, default=PropertyType.apartment.value)
    status = Column(String, default=PropertyStatus.available.value)

    bedrooms = Column(Integer, default=0)
    bathrooms = Column(Integer, default=0)
    area_sqft = Column(Float)
    images = Column(JSON, default=list)

    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant", back_populates="properties")
    created_by_user = relationship("User", back_populates="properties")
    leads = relationship("Lead", back_populates="property")