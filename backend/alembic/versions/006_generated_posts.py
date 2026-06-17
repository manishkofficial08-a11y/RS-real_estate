"""add generated posts

Revision ID: 006
Revises: 005
Create Date: 2026-06-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "generated_posts",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("tenant_id", sa.String(), nullable=False),
        sa.Column("created_by_user_id", sa.String(), nullable=True),
        sa.Column("property_id", sa.String(), nullable=True),
        sa.Column("source_ai_job_id", sa.String(), nullable=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("platform", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("hashtags", sa.JSON(), nullable=True),
        sa.Column("media_asset_ids", sa.JSON(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"]),
        sa.ForeignKeyConstraint(["source_ai_job_id"], ["ai_jobs.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_generated_posts_tenant_id", "generated_posts", ["tenant_id"])
    op.create_index("ix_generated_posts_created_by_user_id", "generated_posts", ["created_by_user_id"])
    op.create_index("ix_generated_posts_property_id", "generated_posts", ["property_id"])
    op.create_index("ix_generated_posts_source_ai_job_id", "generated_posts", ["source_ai_job_id"])
    op.create_index("ix_generated_posts_platform", "generated_posts", ["platform"])
    op.create_index("ix_generated_posts_status", "generated_posts", ["status"])
    op.create_index("ix_generated_posts_is_active", "generated_posts", ["is_active"])
    op.create_index("ix_generated_posts_scheduled_at", "generated_posts", ["scheduled_at"])
    op.create_index("ix_generated_posts_created_at", "generated_posts", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_generated_posts_created_at", table_name="generated_posts")
    op.drop_index("ix_generated_posts_scheduled_at", table_name="generated_posts")
    op.drop_index("ix_generated_posts_is_active", table_name="generated_posts")
    op.drop_index("ix_generated_posts_status", table_name="generated_posts")
    op.drop_index("ix_generated_posts_platform", table_name="generated_posts")
    op.drop_index("ix_generated_posts_source_ai_job_id", table_name="generated_posts")
    op.drop_index("ix_generated_posts_property_id", table_name="generated_posts")
    op.drop_index("ix_generated_posts_created_by_user_id", table_name="generated_posts")
    op.drop_index("ix_generated_posts_tenant_id", table_name="generated_posts")
    op.drop_table("generated_posts")
