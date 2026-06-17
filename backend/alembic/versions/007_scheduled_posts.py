"""add scheduled posts

Revision ID: 007
Revises: 006
Create Date: 2026-06-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "scheduled_posts",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("tenant_id", sa.String(), nullable=False),
        sa.Column("generated_post_id", sa.String(), nullable=False),
        sa.Column("created_by_user_id", sa.String(), nullable=True),
        sa.Column("platform", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("external_post_id", sa.String(), nullable=True),
        sa.Column("external_post_url", sa.Text(), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=True),
        sa.Column("max_retries", sa.Integer(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["generated_post_id"], ["generated_posts.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_scheduled_posts_tenant_id", "scheduled_posts", ["tenant_id"])
    op.create_index("ix_scheduled_posts_generated_post_id", "scheduled_posts", ["generated_post_id"])
    op.create_index("ix_scheduled_posts_created_by_user_id", "scheduled_posts", ["created_by_user_id"])
    op.create_index("ix_scheduled_posts_platform", "scheduled_posts", ["platform"])
    op.create_index("ix_scheduled_posts_status", "scheduled_posts", ["status"])
    op.create_index("ix_scheduled_posts_scheduled_at", "scheduled_posts", ["scheduled_at"])
    op.create_index("ix_scheduled_posts_is_active", "scheduled_posts", ["is_active"])
    op.create_index("ix_scheduled_posts_created_at", "scheduled_posts", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_scheduled_posts_created_at", table_name="scheduled_posts")
    op.drop_index("ix_scheduled_posts_is_active", table_name="scheduled_posts")
    op.drop_index("ix_scheduled_posts_scheduled_at", table_name="scheduled_posts")
    op.drop_index("ix_scheduled_posts_status", table_name="scheduled_posts")
    op.drop_index("ix_scheduled_posts_platform", table_name="scheduled_posts")
    op.drop_index("ix_scheduled_posts_created_by_user_id", table_name="scheduled_posts")
    op.drop_index("ix_scheduled_posts_generated_post_id", table_name="scheduled_posts")
    op.drop_index("ix_scheduled_posts_tenant_id", table_name="scheduled_posts")
    op.drop_table("scheduled_posts")
