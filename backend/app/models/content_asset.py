from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.database.base import Base


class ContentAssetType(str, enum.Enum):
    image = "image"
    video = "video"
    pdf = "pdf"
    text = "text"
    link = "link"


class ContentAsset(Base):
    __tablename__ = "content_assets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    uploaded_by_user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    asset_type = Column(String, default=ContentAssetType.text.value, index=True)

    file_url = Column(Text, nullable=True)
    file_name = Column(String, nullable=True)
    mime_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)

    property_id = Column(String, ForeignKey("properties.id"), nullable=True, index=True)
    metadata_json = Column(JSON, default=dict)

    is_active = Column(Boolean, default=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant")
    uploaded_by_user = relationship("User", foreign_keys=[uploaded_by_user_id])
    property = relationship("Property")
