# ==============================================================================
# Layer: Database Schema Migration (alembic/versions/0006_land_verification.py)
# ALLOWED:
#   - Add jurisdiction_value to users table.
#   - Create land_verifications table for Section 4 ground verification hierarchy.
# ==============================================================================

"""Add jurisdiction_value to users and create land_verifications table

Revision ID: 0006_land_verification
Revises: 0005_document_storage_fields
Create Date: 2026-09-13 11:30:00.000000

"""
from typing import Sequence, Union
import uuid
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0006_land_verification'
down_revision: Union[str, None] = '0005_document_storage_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add jurisdiction_value to users
    op.add_column('users', sa.Column('jurisdiction_value', sa.String(length=255), nullable=True))

    # 2. Create land_verifications table
    op.create_table(
        'land_verifications',
        sa.Column('id', sa.Uuid(), primary_key=True, default=uuid.uuid4),
        sa.Column('case_id', sa.Integer(), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('parcel_ids', sa.JSON(), nullable=False),
        sa.Column('khasra_ownership_confirmed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('ownership_notes', sa.Text(), nullable=True),
        sa.Column('boundary_verification_notes', sa.Text(), nullable=False),
        sa.Column('asset_inventory', sa.JSON(), nullable=False),
        sa.Column('notice_served_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notice_served_notes', sa.Text(), nullable=True),
        sa.Column('submitted_by_officer_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, index=True, server_default='submitted'),
        sa.Column('certified_by_tehsildar_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('certified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tehsildar_notes', sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('land_verifications')
    op.drop_column('users', 'jurisdiction_value')
