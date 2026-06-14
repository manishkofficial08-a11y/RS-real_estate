from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.database.base import Base

class LeadStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    lost = "lost"
    won = "won"

class LeadSource(str, enum.Enum):
    website = "website"
    instagram = "instagram"
    facebook = "facebook"
    referral = "referral"
    whatsapp = "whatsapp"
    other = "other"

class Lead(Base):
    __tablename__ = "leads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    email = Column(String, index=True)
    phone = Column(String)
    source = Column(Enum(LeadSource), default=LeadSource.website)
    status = Column(Enum(LeadStatus), default=LeadStatus.new)
    score = Column(Integer, default=0)
    property_interest_id = Column(String, ForeignKey("properties.id"), nullable=True)
    notes = Column(String)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="leads")
    property = relationship("Property", back_populates="leads")
    assigned_to_user = relationship("User", back_populates="leads")
    activities = relationship("LeadActivity", back_populates="lead")

class LeadActivity(Base):
    __tablename__ = "lead_activities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String, ForeignKey("leads.id"), nullable=False, index=True)
    activity_type = Column(String, nullable=False)
    description = Column(String)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    lead = relationship("Lead", back_populates="activities")
