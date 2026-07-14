"""Track WhatsApp delivery and read receipts.

Revision ID: 014
Revises: 013
"""

from alembic import op
import sqlalchemy as sa


revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "rekha_outreach_messages",
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "rekha_outreach_messages",
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("rekha_outreach_messages", "read_at")
    op.drop_column("rekha_outreach_messages", "delivered_at")
