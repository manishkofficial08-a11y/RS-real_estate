from sqlalchemy import Boolean, Column, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid

from app.database.base import Base


class GeneratedPostStatus(str, enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    published = "published"
    failed = "failed"
    archived = "archived"


class GeneratedPostPlatform(str, enum.Enum):
    instagram = "instagram"
    facebook = "facebook"
    linkedin = "linkedin"
    twitter = "twitter"
    website = "website"
    other = "other"


class GeneratedPost(Base):
    __tablename__ = "generated_posts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    created_by_user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)

    property_id = Column(String, ForeignKey("properties.id"), nullable=True, index=True)
    source_ai_job_id = Column(String, ForeignKey("ai_jobs.id"), nullable=True, index=True)

    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)

    platform = Column(String, default=GeneratedPostPlatform.instagram.value, index=True)
    status = Column(String, default=GeneratedPostStatus.draft.value, index=True)

    hashtags = Column(JSON, default=list)
    media_asset_ids = Column(JSON, default=list)
    metadata_json = Column(JSON, default=dict)

    scheduled_at = Column(DateTime(timezone=True), nullable=True, index=True)
    published_at = Column(DateTime(timezone=True), nullable=True)

    is_active = Column(Boolean, default=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant")
    created_by_user = relationship("User", foreign_keys=[created_by_user_id])
    property = relationship("Property")
    source_ai_job = relationship("AIJob")
