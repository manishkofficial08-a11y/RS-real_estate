from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
import uuid

from app.database.base import Base


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String, nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    is_used = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
