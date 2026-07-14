"""add Rekha digital assistant conversation history

Revision ID: 015
Revises: 014
"""

from alembic import op
import sqlalchemy as sa


revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "rekha_assistant_messages",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("intent", sa.String(), nullable=True),
        sa.Column("action_name", sa.String(), nullable=True),
        sa.Column("action_status", sa.String(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in ("role", "intent", "action_name", "created_by", "created_at"):
        op.create_index(
            f"ix_rekha_assistant_messages_{column}",
            "rekha_assistant_messages",
            [column],
        )


def downgrade() -> None:
    for column in reversed(("role", "intent", "action_name", "created_by", "created_at")):
        op.drop_index(f"ix_rekha_assistant_messages_{column}", table_name="rekha_assistant_messages")
    op.drop_table("rekha_assistant_messages")
