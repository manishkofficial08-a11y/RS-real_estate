"""add team invitations and billing foundation

Revision ID: 009
Revises: 008_password_reset_tokens
Create Date: 2026-06-18
"""

from alembic import op
import sqlalchemy as sa


revision = "009"
down_revision = "008_password_reset_tokens"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE users SET role = 'owner' WHERE role = 'client'")
    op.execute("UPDATE users SET role = 'sales' WHERE role = 'staff'")

    op.create_table(
        "team_invitations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("tenant_id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("invited_by_user_id", sa.String(), nullable=False),
        sa.Column("invite_code", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["invited_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_team_invitations_tenant_id", "team_invitations", ["tenant_id"])
    op.create_index("ix_team_invitations_email", "team_invitations", ["email"])
    op.create_index("ix_team_invitations_status", "team_invitations", ["status"])
    op.create_index(
        "ix_team_invitations_invited_by_user_id",
        "team_invitations",
        ["invited_by_user_id"],
    )
    op.create_index(
        "ix_team_invitations_invite_code",
        "team_invitations",
        ["invite_code"],
        unique=True,
    )
    op.create_index("ix_team_invitations_expires_at", "team_invitations", ["expires_at"])
    op.create_index("ix_team_invitations_created_at", "team_invitations", ["created_at"])

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("tenant_id", sa.String(), nullable=False),
        sa.Column("plan", sa.String(), nullable=False, server_default="free"),
        sa.Column("status", sa.String(), nullable=False, server_default="active"),
        sa.Column("billing_cycle", sa.String(), nullable=False, server_default="monthly"),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "cancel_at_period_end",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("provider", sa.String(), nullable=False, server_default="mock"),
        sa.Column("provider_customer_id", sa.String(), nullable=True),
        sa.Column("provider_subscription_id", sa.String(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_subscriptions_tenant_id", "subscriptions", ["tenant_id"], unique=True)
    op.create_index("ix_subscriptions_plan", "subscriptions", ["plan"])
    op.create_index("ix_subscriptions_status", "subscriptions", ["status"])
    op.create_index(
        "ix_subscriptions_current_period_end",
        "subscriptions",
        ["current_period_end"],
    )
    op.create_index("ix_subscriptions_created_at", "subscriptions", ["created_at"])

    op.execute(
        """
        INSERT INTO subscriptions (
            id, tenant_id, plan, status, billing_cycle,
            current_period_start, current_period_end,
            cancel_at_period_end, provider, metadata_json
        )
        SELECT
            md5(random()::text || clock_timestamp()::text || id),
            id,
            CASE WHEN plan IN ('free', 'pro', 'enterprise') THEN plan ELSE 'free' END,
            'active',
            'monthly',
            NOW(),
            NOW() + INTERVAL '1 month',
            FALSE,
            'mock',
            '{"created_by":"migration_009"}'::json
        FROM tenants
        """
    )

    op.create_table(
        "invoices",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("tenant_id", sa.String(), nullable=False),
        sa.Column("subscription_id", sa.String(), nullable=True),
        sa.Column("invoice_number", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(), nullable=False, server_default="USD"),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("invoice_url", sa.Text(), nullable=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["subscription_id"], ["subscriptions.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_invoices_tenant_id", "invoices", ["tenant_id"])
    op.create_index("ix_invoices_subscription_id", "invoices", ["subscription_id"])
    op.create_index("ix_invoices_invoice_number", "invoices", ["invoice_number"], unique=True)
    op.create_index("ix_invoices_status", "invoices", ["status"])
    op.create_index("ix_invoices_issued_at", "invoices", ["issued_at"])
    op.create_index("ix_invoices_created_at", "invoices", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_invoices_created_at", table_name="invoices")
    op.drop_index("ix_invoices_issued_at", table_name="invoices")
    op.drop_index("ix_invoices_status", table_name="invoices")
    op.drop_index("ix_invoices_invoice_number", table_name="invoices")
    op.drop_index("ix_invoices_subscription_id", table_name="invoices")
    op.drop_index("ix_invoices_tenant_id", table_name="invoices")
    op.drop_table("invoices")

    op.drop_index("ix_subscriptions_created_at", table_name="subscriptions")
    op.drop_index("ix_subscriptions_current_period_end", table_name="subscriptions")
    op.drop_index("ix_subscriptions_status", table_name="subscriptions")
    op.drop_index("ix_subscriptions_plan", table_name="subscriptions")
    op.drop_index("ix_subscriptions_tenant_id", table_name="subscriptions")
    op.drop_table("subscriptions")

    op.drop_index("ix_team_invitations_created_at", table_name="team_invitations")
    op.drop_index("ix_team_invitations_expires_at", table_name="team_invitations")
    op.drop_index("ix_team_invitations_invite_code", table_name="team_invitations")
    op.drop_index(
        "ix_team_invitations_invited_by_user_id",
        table_name="team_invitations",
    )
    op.drop_index("ix_team_invitations_status", table_name="team_invitations")
    op.drop_index("ix_team_invitations_email", table_name="team_invitations")
    op.drop_index("ix_team_invitations_tenant_id", table_name="team_invitations")
    op.drop_table("team_invitations")

    op.execute("UPDATE users SET role = 'client' WHERE role = 'owner'")
    op.execute("UPDATE users SET role = 'staff' WHERE role = 'sales'")
