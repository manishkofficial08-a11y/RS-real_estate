import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class RekhaProspectStatus(str, enum.Enum):
    new = "new"
    researched = "researched"
    drafted = "drafted"
    contacted = "contacted"
    replied = "replied"
    interested = "interested"
    demo_booked = "demo_booked"
    not_now = "not_now"
    not_interested = "not_interested"
    opted_out = "opted_out"


class RekhaMessageStatus(str, enum.Enum):
    draft = "draft"
    approved = "approved"
    sent = "sent"
    failed = "failed"
    received = "received"


class RekhaProspect(Base):
    __tablename__ = "rekha_prospects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    external_id = Column(String, nullable=True, index=True)
    business_name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=True)
    location = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    phone = Column(String, nullable=True, index=True)
    email = Column(String, nullable=True, index=True)
    website = Column(String, nullable=True)
    source = Column(String, nullable=False, default="OpenStreetMap")
    source_url = Column(String, nullable=True)
    lead_score = Column(Integer, nullable=False, default=0)
    fit_score = Column(Integer, nullable=False, default=0)
    fit_reason = Column(Text, nullable=True)
    status = Column(String, nullable=False, default=RekhaProspectStatus.new.value, index=True)
    preferred_channel = Column(String, nullable=True)
    opted_out = Column(Boolean, nullable=False, default=False)
    last_contacted_at = Column(DateTime(timezone=True), nullable=True)
    next_follow_up_at = Column(DateTime(timezone=True), nullable=True)
    replied_at = Column(DateTime(timezone=True), nullable=True)
    demo_booked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    messages = relationship(
        "RekhaOutreachMessage",
        back_populates="prospect",
        cascade="all, delete-orphan",
        order_by="RekhaOutreachMessage.created_at",
    )


class RekhaOutreachMessage(Base):
    __tablename__ = "rekha_outreach_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prospect_id = Column(
        String,
        ForeignKey("rekha_prospects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    channel = Column(String, nullable=False, default="email", index=True)
    direction = Column(String, nullable=False, default="outbound")
    status = Column(String, nullable=False, default=RekhaMessageStatus.draft.value, index=True)
    subject = Column(String, nullable=True)
    body = Column(Text, nullable=False)
    provider = Column(String, nullable=True)
    provider_message_id = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    prospect = relationship("RekhaProspect", back_populates="messages")
