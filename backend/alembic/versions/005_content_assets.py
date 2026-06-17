"""add content assets

Revision ID: 005
Revises: 004
Create Date: 2026-06-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "content_assets",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("tenant_id", sa.String(), nullable=False),
        sa.Column("uploaded_by_user_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("asset_type", sa.String(), nullable=True),
        sa.Column("file_url", sa.Text(), nullable=True),
        sa.Column("file_name", sa.String(), nullable=True),
        sa.Column("mime_type", sa.String(), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("property_id", sa.String(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["uploaded_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_content_assets_tenant_id", "content_assets", ["tenant_id"])
    op.create_index("ix_content_assets_uploaded_by_user_id", "content_assets", ["uploaded_by_user_id"])
    op.create_index("ix_content_assets_asset_type", "content_assets", ["asset_type"])
    op.create_index("ix_content_assets_property_id", "content_assets", ["property_id"])
    op.create_index("ix_content_assets_is_active", "content_assets", ["is_active"])
    op.create_index("ix_content_assets_created_at", "content_assets", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_content_assets_created_at", table_name="content_assets")
    op.drop_index("ix_content_assets_is_active", table_name="content_assets")
    op.drop_index("ix_content_assets_property_id", table_name="content_assets")
    op.drop_index("ix_content_assets_asset_type", table_name="content_assets")
    op.drop_index("ix_content_assets_uploaded_by_user_id", table_name="content_assets")
    op.drop_index("ix_content_assets_tenant_id", table_name="content_assets")
    op.drop_table("content_assets")
