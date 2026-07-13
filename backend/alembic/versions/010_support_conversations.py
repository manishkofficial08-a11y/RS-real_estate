"""add support conversation messages

Revision ID: 010
Revises: 20260619_add_social_accounts
Create Date: 2026-07-13
"""

from alembic import op
import sqlalchemy as sa


revision = "010"
down_revision = "20260619_add_social_accounts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "support_messages",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("ticket_id", sa.String(), nullable=False),
        sa.Column("tenant_id", sa.String(), nullable=False),
        sa.Column("author_user_id", sa.String(), nullable=True),
        sa.Column("author_type", sa.String(), nullable=False, server_default="client"),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["author_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(
            ["ticket_id"],
            ["support_tickets.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_support_messages_ticket_id", "support_messages", ["ticket_id"])
    op.create_index("ix_support_messages_tenant_id", "support_messages", ["tenant_id"])
    op.create_index(
        "ix_support_messages_author_user_id",
        "support_messages",
        ["author_user_id"],
    )
    op.create_index("ix_support_messages_author_type", "support_messages", ["author_type"])
    op.create_index("ix_support_messages_created_at", "support_messages", ["created_at"])

    op.execute(
        """
        INSERT INTO support_messages (
            id, ticket_id, tenant_id, author_user_id, author_type, message, created_at
        )
        SELECT
            md5(random()::text || clock_timestamp()::text || id || 'client'),
            id,
            tenant_id,
            created_by_user_id,
            'client',
            message,
            created_at
        FROM support_tickets
        WHERE message IS NOT NULL AND btrim(message) <> ''
        """
    )
    op.execute(
        """
        INSERT INTO support_messages (
            id, ticket_id, tenant_id, author_user_id, author_type, message, created_at
        )
        SELECT
            md5(random()::text || clock_timestamp()::text || id || 'admin'),
            id,
            tenant_id,
            assigned_admin_id,
            'admin',
            admin_reply,
            COALESCE(updated_at, created_at)
        FROM support_tickets
        WHERE admin_reply IS NOT NULL AND btrim(admin_reply) <> ''
        """
    )


def downgrade() -> None:
    op.drop_index("ix_support_messages_created_at", table_name="support_messages")
    op.drop_index("ix_support_messages_author_type", table_name="support_messages")
    op.drop_index("ix_support_messages_author_user_id", table_name="support_messages")
    op.drop_index("ix_support_messages_tenant_id", table_name="support_messages")
    op.drop_index("ix_support_messages_ticket_id", table_name="support_messages")
    op.drop_table("support_messages")
