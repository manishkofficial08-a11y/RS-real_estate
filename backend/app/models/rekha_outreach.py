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
    needs_founder = "needs_founder"


class RekhaMessageStatus(str, enum.Enum):
    draft = "draft"
    approved = "approved"
    sent = "sent"
    failed = "failed"
    received = "received"


class RekhaCampaignSettings(Base):
    __tablename__ = "rekha_campaign_settings"

    id = Column(String, primary_key=True, default="default")
    is_active = Column(Boolean, nullable=False, default=False)
    auto_follow_ups = Column(Boolean, nullable=False, default=True)
    auto_reply_safe = Column(Boolean, nullable=False, default=False)
    autonomous_discovery = Column(Boolean, nullable=False, default=False)
    auto_initial_outreach = Column(Boolean, nullable=False, default=False)
    discovery_locations = Column(Text, nullable=False, default="Gurgaon, Haryana")
    discovery_industries = Column(Text, nullable=False, default="Local Businesses")
    discovery_channel = Column(String, nullable=False, default="auto")
    minimum_score = Column(Integer, nullable=False, default=60)
    discovery_radius_km = Column(Integer, nullable=False, default=5)
    discovery_batch_size = Column(Integer, nullable=False, default=10)
    discovery_interval_minutes = Column(Integer, nullable=False, default=180)
    last_discovery_at = Column(DateTime(timezone=True), nullable=True)
    next_discovery_at = Column(DateTime(timezone=True), nullable=True)
    consecutive_failures = Column(Integer, nullable=False, default=0)
    working_hours_start = Column(Integer, nullable=False, default=9)
    working_hours_end = Column(Integer, nullable=False, default=18)
    timezone_name = Column(String, nullable=False, default="Asia/Kolkata")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


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
    market_region = Column(String, nullable=False, default="unknown", index=True)
    language_preference = Column(String, nullable=False, default="english")
    opted_out = Column(Boolean, nullable=False, default=False)
    whatsapp_opt_in = Column(Boolean, nullable=False, default=False)
    whatsapp_opted_in_at = Column(DateTime(timezone=True), nullable=True)
    automation_paused = Column(Boolean, nullable=False, default=False)
    requires_founder = Column(Boolean, nullable=False, default=False, index=True)
    founder_note = Column(Text, nullable=True)
    last_intent = Column(String, nullable=True)
    follow_up_stage = Column(Integer, nullable=False, default=0)
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
    message_kind = Column(String, nullable=False, default="initial", index=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True, index=True)
    auto_generated = Column(Boolean, nullable=False, default=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    prospect = relationship("RekhaProspect", back_populates="messages")


class RekhaAutomationRun(Base):
    __tablename__ = "rekha_automation_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    status = Column(String, nullable=False, default="running", index=True)
    industry = Column(String, nullable=True)
    location = Column(String, nullable=True)
    channel = Column(String, nullable=True)
    discovered_count = Column(Integer, nullable=False, default=0)
    qualified_count = Column(Integer, nullable=False, default=0)
    imported_count = Column(Integer, nullable=False, default=0)
    drafted_count = Column(Integer, nullable=False, default=0)
    sent_count = Column(Integer, nullable=False, default=0)
    duplicates_skipped = Column(Integer, nullable=False, default=0)
    failed_count = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
