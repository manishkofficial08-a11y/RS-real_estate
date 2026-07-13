"""add Rekha automation and escalation controls

Revision ID: 012
Revises: 011
"""

from alembic import op
import sqlalchemy as sa


revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "rekha_campaign_settings",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("auto_follow_ups", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("auto_reply_safe", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("working_hours_start", sa.Integer(), nullable=False, server_default="9"),
        sa.Column("working_hours_end", sa.Integer(), nullable=False, server_default="18"),
        sa.Column("timezone_name", sa.String(), nullable=False, server_default="Asia/Kolkata"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.add_column("rekha_prospects", sa.Column("market_region", sa.String(), nullable=False, server_default="unknown"))
    op.add_column("rekha_prospects", sa.Column("language_preference", sa.String(), nullable=False, server_default="english"))
    op.add_column("rekha_prospects", sa.Column("automation_paused", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("rekha_prospects", sa.Column("requires_founder", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("rekha_prospects", sa.Column("founder_note", sa.Text(), nullable=True))
    op.add_column("rekha_prospects", sa.Column("last_intent", sa.String(), nullable=True))
    op.add_column("rekha_prospects", sa.Column("follow_up_stage", sa.Integer(), nullable=False, server_default="0"))
    op.create_index("ix_rekha_prospects_market_region", "rekha_prospects", ["market_region"])
    op.create_index("ix_rekha_prospects_requires_founder", "rekha_prospects", ["requires_founder"])
    op.add_column("rekha_outreach_messages", sa.Column("message_kind", sa.String(), nullable=False, server_default="initial"))
    op.add_column("rekha_outreach_messages", sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("rekha_outreach_messages", sa.Column("auto_generated", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index("ix_rekha_outreach_messages_message_kind", "rekha_outreach_messages", ["message_kind"])
    op.create_index("ix_rekha_outreach_messages_scheduled_at", "rekha_outreach_messages", ["scheduled_at"])


def downgrade() -> None:
    op.drop_index("ix_rekha_outreach_messages_scheduled_at", table_name="rekha_outreach_messages")
    op.drop_index("ix_rekha_outreach_messages_message_kind", table_name="rekha_outreach_messages")
    op.drop_column("rekha_outreach_messages", "auto_generated")
    op.drop_column("rekha_outreach_messages", "scheduled_at")
    op.drop_column("rekha_outreach_messages", "message_kind")
    op.drop_index("ix_rekha_prospects_requires_founder", table_name="rekha_prospects")
    op.drop_index("ix_rekha_prospects_market_region", table_name="rekha_prospects")
    for column in ("follow_up_stage", "last_intent", "founder_note", "requires_founder", "automation_paused", "language_preference", "market_region"):
        op.drop_column("rekha_prospects", column)
    op.drop_table("rekha_campaign_settings")
