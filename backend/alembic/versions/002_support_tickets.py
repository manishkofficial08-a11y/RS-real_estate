"""Add support tickets

Revision ID: 002
Revises: 001
Create Date: 2026-06-16 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "support_tickets",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("tenant_id", sa.String(), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column(
            "created_by_user_id",
            sa.String(),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("subject", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("priority", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("admin_reply", sa.Text(), nullable=True),
        sa.Column("assigned_admin_id", sa.String(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_support_tickets_tenant_id", "support_tickets", ["tenant_id"])
    op.create_index(
        "ix_support_tickets_created_by_user_id",
        "support_tickets",
        ["created_by_user_id"],
    )
    op.create_index("ix_support_tickets_status", "support_tickets", ["status"])
    op.create_index("ix_support_tickets_priority", "support_tickets", ["priority"])


def downgrade() -> None:
    op.drop_index("ix_support_tickets_priority", table_name="support_tickets")
    op.drop_index("ix_support_tickets_status", table_name="support_tickets")
    op.drop_index("ix_support_tickets_created_by_user_id", table_name="support_tickets")
    op.drop_index("ix_support_tickets_tenant_id", table_name="support_tickets")
    op.drop_table("support_tickets")
