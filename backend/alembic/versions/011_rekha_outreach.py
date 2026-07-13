"""add Rekha outreach pipeline

Revision ID: 011
Revises: 010
Create Date: 2026-07-13
"""

from alembic import op
import sqlalchemy as sa


revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "rekha_prospects",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("external_id", sa.String(), nullable=True),
        sa.Column("business_name", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("website", sa.String(), nullable=True),
        sa.Column("source", sa.String(), nullable=False, server_default="OpenStreetMap"),
        sa.Column("source_url", sa.String(), nullable=True),
        sa.Column("lead_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fit_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("fit_reason", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="new"),
        sa.Column("preferred_channel", sa.String(), nullable=True),
        sa.Column("opted_out", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("last_contacted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_follow_up_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("replied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("demo_booked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in ("external_id", "business_name", "phone", "email", "status", "created_at"):
        op.create_index(f"ix_rekha_prospects_{column}", "rekha_prospects", [column])

    op.create_table(
        "rekha_outreach_messages",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("prospect_id", sa.String(), nullable=False),
        sa.Column("channel", sa.String(), nullable=False, server_default="email"),
        sa.Column("direction", sa.String(), nullable=False, server_default="outbound"),
        sa.Column("status", sa.String(), nullable=False, server_default="draft"),
        sa.Column("subject", sa.String(), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("provider", sa.String(), nullable=True),
        sa.Column("provider_message_id", sa.String(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["prospect_id"], ["rekha_prospects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in ("prospect_id", "channel", "status", "created_at"):
        op.create_index(
            f"ix_rekha_outreach_messages_{column}",
            "rekha_outreach_messages",
            [column],
        )


def downgrade() -> None:
    op.drop_table("rekha_outreach_messages")
    op.drop_table("rekha_prospects")
