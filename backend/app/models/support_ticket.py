from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.database.base import Base


class SupportTicketStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class SupportTicketPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class SupportTicketCategory(str, enum.Enum):
    general = "general"
    billing = "billing"
    technical = "technical"
    crm = "crm"
    properties = "properties"
    ai_agents = "ai_agents"
    other = "other"


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    created_by_user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    subject = Column(String, nullable=False)
    category = Column(String, default=SupportTicketCategory.general.value)
    priority = Column(String, default=SupportTicketPriority.medium.value)
    status = Column(String, default=SupportTicketStatus.open.value)

    message = Column(Text, nullable=False)
    admin_reply = Column(Text, nullable=True)

    assigned_admin_id = Column(String, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant")
    created_by_user = relationship("User", foreign_keys=[created_by_user_id])
    assigned_admin = relationship("User", foreign_keys=[assigned_admin_id])