"""add Rekha autonomous operator runtime

Revision ID: 013
Revises: 012
"""

from alembic import op
import sqlalchemy as sa


revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("rekha_campaign_settings", sa.Column("autonomous_discovery", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("rekha_campaign_settings", sa.Column("auto_initial_outreach", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("rekha_campaign_settings", sa.Column("discovery_locations", sa.Text(), nullable=False, server_default="Gurgaon, Haryana"))
    op.add_column("rekha_campaign_settings", sa.Column("discovery_industries", sa.Text(), nullable=False, server_default="Local Businesses"))
    op.add_column("rekha_campaign_settings", sa.Column("discovery_channel", sa.String(), nullable=False, server_default="auto"))
    op.add_column("rekha_campaign_settings", sa.Column("minimum_score", sa.Integer(), nullable=False, server_default="60"))
    op.add_column("rekha_campaign_settings", sa.Column("discovery_radius_km", sa.Integer(), nullable=False, server_default="5"))
    op.add_column("rekha_campaign_settings", sa.Column("discovery_batch_size", sa.Integer(), nullable=False, server_default="10"))
    op.add_column("rekha_campaign_settings", sa.Column("discovery_interval_minutes", sa.Integer(), nullable=False, server_default="180"))
    op.add_column("rekha_campaign_settings", sa.Column("last_discovery_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("rekha_campaign_settings", sa.Column("next_discovery_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("rekha_campaign_settings", sa.Column("consecutive_failures", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("rekha_prospects", sa.Column("whatsapp_opt_in", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("rekha_prospects", sa.Column("whatsapp_opted_in_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "rekha_automation_runs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="running"),
        sa.Column("industry", sa.String(), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("channel", sa.String(), nullable=True),
        sa.Column("discovered_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("qualified_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("imported_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("drafted_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sent_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duplicates_skipped", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_rekha_automation_runs_status", "rekha_automation_runs", ["status"])
    op.create_index("ix_rekha_automation_runs_started_at", "rekha_automation_runs", ["started_at"])


def downgrade() -> None:
    op.drop_index("ix_rekha_automation_runs_started_at", table_name="rekha_automation_runs")
    op.drop_index("ix_rekha_automation_runs_status", table_name="rekha_automation_runs")
    op.drop_table("rekha_automation_runs")
    op.drop_column("rekha_prospects", "whatsapp_opted_in_at")
    op.drop_column("rekha_prospects", "whatsapp_opt_in")
    for column in (
        "consecutive_failures", "next_discovery_at", "last_discovery_at",
        "discovery_interval_minutes", "discovery_batch_size", "discovery_radius_km",
        "minimum_score", "discovery_channel", "discovery_industries",
        "discovery_locations", "auto_initial_outreach", "autonomous_discovery",
    ):
        op.drop_column("rekha_campaign_settings", column)
