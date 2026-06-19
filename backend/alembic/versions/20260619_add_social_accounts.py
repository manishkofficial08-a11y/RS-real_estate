"""add social accounts

Revision ID: 20260619_add_social_accounts
Revises: 
Create Date: 2026-06-19
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260619_add_social_accounts"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "social_accounts",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("tenant_id", sa.String(), nullable=False),
        sa.Column("created_by_user_id", sa.String(), nullable=True),
        sa.Column("platform", sa.String(), nullable=False),
        sa.Column("account_name", sa.String(), nullable=False),
        sa.Column("external_account_id", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("scopes", sa.JSON(), nullable=True),
        sa.Column("access_token_encrypted", sa.Text(), nullable=True),
        sa.Column("refresh_token_encrypted", sa.Text(), nullable=True),
        sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_connected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(op.f("ix_social_accounts_id"), "social_accounts", ["id"], unique=False)
    op.create_index(op.f("ix_social_accounts_tenant_id"), "social_accounts", ["tenant_id"], unique=False)
    op.create_index(op.f("ix_social_accounts_created_by_user_id"), "social_accounts", ["created_by_user_id"], unique=False)
    op.create_index(op.f("ix_social_accounts_platform"), "social_accounts", ["platform"], unique=False)
    op.create_index(op.f("ix_social_accounts_external_account_id"), "social_accounts", ["external_account_id"], unique=False)
    op.create_index(op.f("ix_social_accounts_status"), "social_accounts", ["status"], unique=False)
    op.create_index(op.f("ix_social_accounts_is_active"), "social_accounts", ["is_active"], unique=False)
    op.create_index(op.f("ix_social_accounts_created_at"), "social_accounts", ["created_at"], unique=False)
    op.create_index(
        "ix_social_accounts_tenant_platform_active",
        "social_accounts",
        ["tenant_id", "platform", "is_active"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_social_accounts_tenant_platform_active", table_name="social_accounts")
    op.drop_index(op.f("ix_social_accounts_created_at"), table_name="social_accounts")
    op.drop_index(op.f("ix_social_accounts_is_active"), table_name="social_accounts")
    op.drop_index(op.f("ix_social_accounts_status"), table_name="social_accounts")
    op.drop_index(op.f("ix_social_accounts_external_account_id"), table_name="social_accounts")
    op.drop_index(op.f("ix_social_accounts_platform"), table_name="social_accounts")
    op.drop_index(op.f("ix_social_accounts_created_by_user_id"), table_name="social_accounts")
    op.drop_index(op.f("ix_social_accounts_tenant_id"), table_name="social_accounts")
    op.drop_index(op.f("ix_social_accounts_id"), table_name="social_accounts")
    op.drop_table("social_accounts")
