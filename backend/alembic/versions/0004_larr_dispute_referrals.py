# ==============================================================================
# Layer: Database Schema Migration (alembic/versions/0004_larr_dispute_referrals.py)
# ALLOWED:
#   - Create dispute_referrals table for LARR Authority compensation dispute workflows.
# ==============================================================================

"""LARR Authority compensation dispute referrals table

Revision ID: 0004_larr_dispute_referrals
Revises: 0003_disputes_risk_signatures
Create Date: 2026-09-12 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0004_larr_dispute_referrals'
down_revision: Union[str, None] = '0003_disputes_risk_signatures'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create dispute_referrals table (RFCTLARR Act Chapter VIII compliance)
    op.create_table(
        'dispute_referrals',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('case_id', sa.Integer(), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('referred_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('referred_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('larr_case_number', sa.String(length=100), nullable=True),
        sa.Column('hearing_dates', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='referred'),
        sa.Column('outcome', sa.Text(), nullable=True),
        sa.Column('high_court_appeal_outcome', sa.Text(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('idx_dispute_referrals_status', 'dispute_referrals', ['status'])
    op.create_index('idx_dispute_referrals_case_status', 'dispute_referrals', ['case_id', 'status'])


def downgrade() -> None:
    op.drop_index('idx_dispute_referrals_case_status', table_name='dispute_referrals')
    op.drop_index('idx_dispute_referrals_status', table_name='dispute_referrals')
    op.drop_table('dispute_referrals')
