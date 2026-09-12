# ==============================================================================
# Layer: Database Schema Migration (alembic/versions/0001_initial_schema.py)
# ALLOWED:
#   - Define DDL operations to establish the initial relational & geospatial schema.
#   - Enable the PostGIS extension and create spatial columns.
# NOT ALLOWED:
#   - Do not perform application business checks or seed live operational data in schema migrations.
# ==============================================================================

"""Initial schema setup with PostGIS and workflow entities

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-03 10:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Ensure PostGIS extension is available
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # 2. States table
    op.create_table(
        'states',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(length=100), nullable=False, unique=True)
    )

    # 3. Districts table
    op.create_table(
        'districts',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('state_id', sa.Integer(), sa.ForeignKey('states.id', ondelete='CASCADE'), nullable=False)
    )

    # 4. Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('jurisdiction_level', sa.String(length=20), nullable=False),
        sa.Column('jurisdiction_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # 5. Cases table (defined before parcels to resolve circular references or allow FK)
    op.create_table(
        'cases',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('project_name', sa.String(length=255), nullable=False),
        sa.Column('requiring_body_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('purpose_category', sa.String(length=50), nullable=False),
        sa.Column('justification', sa.Text(), nullable=False),
        sa.Column('estimated_affected_families', sa.Integer(), nullable=False, default=0),
        sa.Column('district_id', sa.Integer(), sa.ForeignKey('districts.id'), nullable=False),
        sa.Column('state_id', sa.Integer(), sa.ForeignKey('states.id'), nullable=False),
        sa.Column('current_stage', sa.String(length=50), nullable=False),
        sa.Column('stage_entered_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_index('ix_cases_current_stage', 'cases', ['current_stage'])
    op.create_index('ix_cases_district_id', 'cases', ['district_id'])

    # 6. Parcels table (with PostGIS Geometry)
    op.create_table(
        'parcels',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('khasra_number', sa.String(length=100), nullable=False),
        sa.Column('district_id', sa.Integer(), sa.ForeignKey('districts.id'), nullable=False),
        sa.Column('geometry', Geometry(geometry_type='POLYGON', srid=4326), nullable=False),
        sa.Column('area_hectares', sa.Numeric(precision=10, scale=4), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, default='not_started'),
        sa.Column('current_case_id', sa.Integer(), sa.ForeignKey('cases.id', ondelete='SET NULL'), nullable=True)
    )
    op.create_index('ix_parcels_district_id', 'parcels', ['district_id'])
    op.create_index('ix_parcels_khasra_number', 'parcels', ['khasra_number'])

    # 7. Case Parcels join table (many-to-many)
    op.create_table(
        'case_parcels',
        sa.Column('case_id', sa.Integer(), sa.ForeignKey('cases.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('parcel_id', sa.Integer(), sa.ForeignKey('parcels.id', ondelete='CASCADE'), primary_key=True)
    )

    # 8. Audit Log table (append-only)
    op.create_table(
        'audit_log',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.Integer(), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('actor_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('flagged', sa.Boolean(), nullable=False, default=False),
        sa.Column('flagged_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True)
    )
    op.create_index('ix_audit_log_case_id', 'audit_log', ['case_id'])

    # 9. Documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.Integer(), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('stage', sa.String(length=50), nullable=False),
        sa.Column('doc_type', sa.String(length=50), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('uploaded_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_index('ix_documents_case_id', 'documents', ['case_id'])

    # 10. SIA Verdicts table (1:1 with Case)
    op.create_table(
        'sia_verdicts',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.Integer(), sa.ForeignKey('cases.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('agree_public_purpose', sa.Boolean(), nullable=False),
        sa.Column('min_land_confirmed', sa.Boolean(), nullable=False),
        sa.Column('alternate_location_feasible', sa.Boolean(), nullable=False),
        sa.Column('independent_family_estimate', sa.Integer(), nullable=False),
        sa.Column('cost_rating', sa.String(length=20), nullable=False),
        sa.Column('recommendation', sa.String(length=50), nullable=False),
        sa.Column('report_document_id', sa.Integer(), sa.ForeignKey('documents.id'), nullable=True),
        sa.Column('hearing_date', sa.Date(), nullable=True),
        sa.Column('hearing_minutes_document_id', sa.Integer(), sa.ForeignKey('documents.id'), nullable=True),
        sa.Column('submitted_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )

    # 11. Objections table
    op.create_table(
        'objections',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.Integer(), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('document_id', sa.Integer(), sa.ForeignKey('documents.id'), nullable=True),
        sa.Column('logged_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('logged_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_index('ix_objections_case_id', 'objections', ['case_id'])

    # 12. Awards table (1:1 with Case)
    op.create_table(
        'awards',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.Integer(), sa.ForeignKey('cases.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('compensation_amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('award_document_id', sa.Integer(), sa.ForeignKey('documents.id'), nullable=True),
        sa.Column('declared_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('declared_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )

    # 13. RR Schemes table (1:1 with Case)
    op.create_table(
        'rr_schemes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.Integer(), sa.ForeignKey('cases.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('scheme_document_id', sa.Integer(), sa.ForeignKey('documents.id'), nullable=True),
        sa.Column('development_plan_document_id', sa.Integer(), sa.ForeignKey('documents.id'), nullable=True),
        sa.Column('created_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )

    # 14. Affected Families table
    op.create_table(
        'affected_families',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.Integer(), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('family_head_name', sa.String(length=150), nullable=False),
        sa.Column('current_address', sa.Text(), nullable=False),
        sa.Column('land_reference', sa.String(length=100), nullable=False),
        sa.Column('rr_status', sa.String(length=50), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_index('ix_affected_families_case_id', 'affected_families', ['case_id'])

    # 15. Family Status Log table (append-only)
    op.create_table(
        'family_status_log',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('family_id', sa.Integer(), sa.ForeignKey('affected_families.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('document_id', sa.Integer(), sa.ForeignKey('documents.id'), nullable=True),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('updated_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_index('ix_family_status_log_family_id', 'family_status_log', ['family_id'])

    # 16. Statutory Stage Duration Config table (SLA reference)
    op.create_table(
        'stage_duration_config',
        sa.Column('stage', sa.String(length=50), primary_key=True),
        sa.Column('expected_days', sa.Integer(), nullable=False)
    )


def downgrade() -> None:
    op.drop_table('stage_duration_config')
    op.drop_table('family_status_log')
    op.drop_table('affected_families')
    op.drop_table('rr_schemes')
    op.drop_table('awards')
    op.drop_table('objections')
    op.drop_table('sia_verdicts')
    op.drop_table('documents')
    op.drop_table('audit_log')
    op.drop_table('case_parcels')
    op.drop_table('parcels')
    op.drop_table('cases')
    op.drop_table('users')
    op.drop_table('districts')
    op.drop_table('states')
