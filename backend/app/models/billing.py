from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid

from app.database.base import Base


class SubscriptionPlan(str, enum.Enum):
    free = "free"
    pro = "pro"
    enterprise = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    trialing = "trialing"
    past_due = "past_due"
    cancelled = "cancelled"
    inactive = "inactive"


class BillingCycle(str, enum.Enum):
    monthly = "monthly"
    yearly = "yearly"


class InvoiceStatus(str, enum.Enum):
    paid = "paid"
    pending = "pending"
    failed = "failed"
    void = "void"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(
        String,
        ForeignKey("tenants.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    plan = Column(String, default=SubscriptionPlan.free.value, nullable=False, index=True)
    status = Column(
        String,
        default=SubscriptionStatus.active.value,
        nullable=False,
        index=True,
    )
    billing_cycle = Column(
        String,
        default=BillingCycle.monthly.value,
        nullable=False,
    )
    current_period_start = Column(DateTime(timezone=True), nullable=False)
    current_period_end = Column(DateTime(timezone=True), nullable=False, index=True)
    cancel_at_period_end = Column(Boolean, default=False, nullable=False)
    provider = Column(String, default="mock", nullable=False)
    provider_customer_id = Column(String, nullable=True)
    provider_subscription_id = Column(String, nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False, index=True)
    subscription_id = Column(
        String,
        ForeignKey("subscriptions.id"),
        nullable=True,
        index=True,
    )
    invoice_number = Column(String, nullable=False, unique=True, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD", nullable=False)
    status = Column(String, default=InvoiceStatus.pending.value, nullable=False, index=True)
    invoice_url = Column(Text, nullable=True)
    issued_at = Column(DateTime(timezone=True), nullable=False, index=True)
    due_at = Column(DateTime(timezone=True), nullable=False)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    tenant = relationship("Tenant")
    subscription = relationship("Subscription")
