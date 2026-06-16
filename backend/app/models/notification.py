from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid

from app.database.base import Base


class NotificationAudience(str, enum.Enum):
    client = "client"
    admin = "admin"


class NotificationType(str, enum.Enum):
    support_ticket_created = "support_ticket_created"
    support_ticket_replied = "support_ticket_replied"
    support_ticket_status_updated = "support_ticket_status_updated"
    system = "system"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=True, index=True)
    recipient_user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)

    audience = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False, index=True)

    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)

    related_entity_type = Column(String, nullable=True)
    related_entity_id = Column(String, nullable=True)

    link = Column(String, nullable=True)

    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant")
    recipient_user = relationship("User", foreign_keys=[recipient_user_id])