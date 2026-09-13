# ==============================================================================
# Layer: Database Schema Migration (alembic/versions/0005_document_storage_fields.py)
# ALLOWED:
#   - Add storage_key, filename, mime_type, document_type, title, and file_size_bytes to documents table.
# ==============================================================================

"""Add storage_key, filename, mime_type, document_type, title, file_size_bytes to documents table

Revision ID: 0005_document_storage_fields
Revises: 0004_larr_dispute_referrals
Create Date: 2026-09-13 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0005_document_storage_fields'
down_revision: Union[str, None] = '0004_larr_dispute_referrals'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('documents', sa.Column('document_type', sa.String(length=100), nullable=True))
    op.add_column('documents', sa.Column('title', sa.String(length=255), nullable=True))
    op.add_column('documents', sa.Column('filename', sa.String(length=255), nullable=True))
    op.add_column('documents', sa.Column('storage_key', sa.String(length=500), nullable=True))
    op.add_column('documents', sa.Column('mime_type', sa.String(length=100), nullable=False, server_default='application/pdf'))
    op.add_column('documents', sa.Column('file_size_bytes', sa.Integer(), nullable=True, server_default='0'))


def downgrade() -> None:
    op.drop_column('documents', 'file_size_bytes')
    op.drop_column('documents', 'mime_type')
    op.drop_column('documents', 'storage_key')
    op.drop_column('documents', 'filename')
    op.drop_column('documents', 'title')
    op.drop_column('documents', 'document_type')
