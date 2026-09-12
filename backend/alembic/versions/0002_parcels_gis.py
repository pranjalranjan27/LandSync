# ==============================================================================
# Layer: Database Schema Migration (alembic/versions/0002_parcels_gis.py)
# ALLOWED:
#   - Define DDL operations to establish the upgraded Cadastral Parcels GIS schema.
#   - Create PostGIS Polygon geometry column with SRID 4326 and spatial GIST index.
# ==============================================================================

"""Upgraded Cadastral Parcels table with PostGIS Polygon geometry and spatial indexing

Revision ID: 0002_parcels_gis
Revises: 0001_initial_schema
Create Date: 2026-09-12 11:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision: str = '0002_parcels_gis'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing parcels table if needed to rebuild with UUID and new schema
    conn = op.get_bind()
    is_sqlite = conn.dialect.name == "sqlite"

    op.execute("DROP TABLE IF EXISTS case_parcels CASCADE;")
    op.execute("DROP TABLE IF EXISTS parcels CASCADE;")

    # Recreate parcels table with comprehensive cadastral attributes
    op.create_table(
        'parcels',
        sa.Column('id', sa.Uuid(), primary_key=True),
        sa.Column('khasra_number', sa.String(length=100), nullable=False, index=True),
        sa.Column('village', sa.String(length=150), nullable=False),
        sa.Column('tehsil', sa.String(length=150), nullable=False),
        sa.Column('district', sa.String(length=150), nullable=False, index=True),
        sa.Column('state', sa.String(length=150), nullable=False),
        sa.Column('revenue_sheet_no', sa.String(length=50), nullable=False),
        sa.Column('geometry', Geometry(geometry_type='POLYGON', srid=4326), nullable=False),
        sa.Column('centroid_lat', sa.Float(), nullable=False),
        sa.Column('centroid_lng', sa.Float(), nullable=False),
        sa.Column('area_sqm', sa.Float(), nullable=False),
        sa.Column('encroachment_status', sa.String(length=50), nullable=False, server_default='clear'),
        sa.Column('ownership_type', sa.String(length=50), nullable=False, server_default='private'),
        sa.Column('case_id', sa.Integer(), sa.ForeignKey('cases.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('village', 'khasra_number', name='uq_parcels_village_khasra')
    )

    if not is_sqlite:
        # Spatial GIST index on geometry
        op.create_index(
            'idx_parcels_geometry',
            'parcels',
            ['geometry'],
            postgresql_using='gist'
        )


def downgrade() -> None:
    op.drop_table('parcels')
