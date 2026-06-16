from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.database.base import Base


class AIJobStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class AIJobType(str, enum.Enum):
    caption = "caption"
    hashtag = "hashtag"
    scheduler = "scheduler"
    publisher = "publisher"
    analytics = "analytics"
    recommendation = "recommendation"
    report = "report"
    chat = "chat"
    voice = "voice"
    orchestrator = "orchestrator"
    other = "other"


class AIJobPriority(str, enum.Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


class AIJob(Base):
    __tablename__ = "ai_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    created_by_user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)

    job_type = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    status = Column(String, default=AIJobStatus.queued.value, index=True)
    priority = Column(String, default=AIJobPriority.normal.value, index=True)

    input_payload = Column(Text, nullable=True)
    output_payload = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    progress = Column(Integer, default=0)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)

    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant")
    created_by_user = relationship("User", foreign_keys=[created_by_user_id])