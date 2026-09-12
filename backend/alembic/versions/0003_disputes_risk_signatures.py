# ==============================================================================
# Layer: Database Schema Migration (alembic/versions/0003_disputes_risk_signatures.py)
# ALLOWED:
#   - Add dispute columns (dispute_status, dispute_source, dispute_notes) to parcels.
#   - Add dispute warning and location sensitivity columns to cases.
#   - Create village_circle_rates table for NGDRS valuation integration.
#   - Create document_signatures table for tamper-evident digital signatures under IT Act 2000.
# ==============================================================================

"""Disputes GIS gate, village circle rates, and tamper-evident digital signatures

Revision ID: 0003_disputes_risk_signatures
Revises: 0002_parcels_gis
Create Date: 2026-09-12 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0003_disputes_risk_signatures'
down_revision: Union[str, None] = '0002_parcels_gis'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add dispute tracking columns to parcels table
    op.add_column('parcels', sa.Column('dispute_status', sa.String(length=50), nullable=False, server_default='clear'))
    op.add_column('parcels', sa.Column('dispute_source', sa.String(length=100), nullable=True))
    op.add_column('parcels', sa.Column('dispute_notes', sa.Text(), nullable=True))
    op.create_index('idx_parcels_dispute_status', 'parcels', ['dispute_status'])

    # 2. Add dispute warning flag and location sensitivity to cases table
    op.add_column('cases', sa.Column('has_dispute_warning', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('cases', sa.Column('location_sensitivity', sa.String(length=50), nullable=False, server_default='standard'))

    # 3. Create village_circle_rates table (NGDRS property valuation integration)
    op.create_table(
        'village_circle_rates',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('village', sa.String(length=150), nullable=False, index=True),
        sa.Column('district', sa.String(length=150), nullable=False, index=True),
        sa.Column('rate_per_sqm', sa.Float(), nullable=False),
        sa.Column('effective_year', sa.Integer(), nullable=False),
        sa.UniqueConstraint('village', 'district', 'effective_year', name='uq_village_district_year')
    )
    op.create_index('idx_circle_rates_lookup', 'village_circle_rates', ['district', 'village'])

    # 4. Create document_signatures table (IT Act 2000 Section 3 compliance)
    op.create_table(
        'document_signatures',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('case_id', sa.Integer(), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('document_id', sa.Integer(), sa.ForeignKey('documents.id', ondelete='SET NULL'), nullable=True),
        sa.Column('signer_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('signer_role', sa.String(length=50), nullable=False),
        sa.Column('signer_jurisdiction', sa.String(length=150), nullable=False),
        sa.Column('action_type', sa.String(length=50), nullable=False),
        sa.Column('payload_hash', sa.String(length=64), nullable=False),
        sa.Column('signed_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_signatures_case_action', 'document_signatures', ['case_id', 'action_type'])


def downgrade() -> None:
    op.drop_table('document_signatures')
    op.drop_table('village_circle_rates')
    op.drop_column('cases', 'location_sensitivity')
    op.drop_column('cases', 'has_dispute_warning')
    op.drop_index('idx_parcels_dispute_status', table_name='parcels')
    op.drop_column('parcels', 'dispute_notes')
    op.drop_column('parcels', 'dispute_source')
    op.drop_column('parcels', 'dispute_status')
