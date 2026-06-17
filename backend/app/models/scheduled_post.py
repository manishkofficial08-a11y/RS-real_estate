from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid

from app.database.base import Base


class ScheduledPostStatus(str, enum.Enum):
    scheduled = "scheduled"
    publishing = "publishing"
    published = "published"
    failed = "failed"
    cancelled = "cancelled"


class ScheduledPostPlatform(str, enum.Enum):
    instagram = "instagram"
    facebook = "facebook"
    linkedin = "linkedin"
    twitter = "twitter"
    website = "website"
    other = "other"


class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    generated_post_id = Column(String, ForeignKey("generated_posts.id"), nullable=False, index=True)
    created_by_user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)

    platform = Column(String, default=ScheduledPostPlatform.instagram.value, index=True)
    status = Column(String, default=ScheduledPostStatus.scheduled.value, index=True)

    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    failure_reason = Column(Text, nullable=True)

    external_post_id = Column(String, nullable=True)
    external_post_url = Column(Text, nullable=True)

    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    metadata_json = Column(JSON, default=dict)

    is_active = Column(Boolean, default=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant")
    generated_post = relationship("GeneratedPost")
    created_by_user = relationship("User", foreign_keys=[created_by_user_id])
