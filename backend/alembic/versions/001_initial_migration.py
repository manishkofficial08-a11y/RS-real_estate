"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Tenants table
    op.create_table('tenants',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('business_type', sa.String(), nullable=True),
        sa.Column('plan', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Users table
    op.create_table('users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('tenant_id', sa.String(), sa.ForeignKey('tenants.id'), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # Properties table
    op.create_table('properties',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('tenant_id', sa.String(), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('property_type', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('bedrooms', sa.Integer(), default=0),
        sa.Column('bathrooms', sa.Integer(), default=0),
        sa.Column('area_sqft', sa.Float(), nullable=True),
        sa.Column('images', sa.JSON(), nullable=True),
        sa.Column('created_by', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_properties_tenant_id', 'properties', ['tenant_id'])

    # Leads table
    op.create_table('leads',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('tenant_id', sa.String(), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('score', sa.Integer(), default=0),
        sa.Column('property_interest_id', sa.String(), sa.ForeignKey('properties.id'), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('assigned_to', sa.String(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_leads_tenant_id', 'leads', ['tenant_id'])

    # Lead Activities table
    op.create_table('lead_activities',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('lead_id', sa.String(), sa.ForeignKey('leads.id'), nullable=False),
        sa.Column('activity_type', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_by', sa.String(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_lead_activities_lead_id', 'lead_activities', ['lead_id'])


def downgrade() -> None:
    op.drop_table('lead_activities')
    op.drop_table('leads')
    op.drop_table('properties')
    op.drop_table('users')
    op.drop_table('tenants')
