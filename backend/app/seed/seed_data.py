# ==============================================================================
# Layer: Seed Data Script (app/seed/seed_data.py)
# ALLOWED:
#   - Populate realistic initial demo data: states, districts, parcels, users,
#     statutory SLA configurations, and sample workflow cases with audit histories.
#   - Provide standalone CLI execution capability.
# NOT ALLOWED:
#   - Do NOT run this automatically in production migrations.
# ==============================================================================

import os
import sys
from datetime import datetime, date, timedelta, timezone
from decimal import Decimal

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.enums import (
    CaseStage,
    UserRole,
    JurisdictionLevel,
    ParcelStatus,
    PurposeCategory,
    DocumentType,
    SIACostRating,
    SIARecommendation,
    RRStatus,
    DisputeReferralStatus,
    EncroachmentStatus,
    DisputeStatus,
    OwnershipType,
)
from app.models.user import State, District, User
from app.models.parcel import Parcel
from app.models.case import Case
from app.models.audit import AuditLog
from app.models.document import Document
from app.models.dispute_referral import DisputeReferral
from app.models.workflow import (
    SIAVerdict,
    Objection,
    Award,
    RRScheme,
    AffectedFamily,
    FamilyStatusLog,
    StageDurationConfig,
)
from geoalchemy2.elements import WKTElement


def seed_database():
    """Populates the demo database with states, districts, parcels, users, and multi-stage cases."""
    db = SessionLocal()
    try:
        print("[INFO] [1/6] Seeding statutory stage SLA durations...")
        stage_slas = {
            CaseStage.PROPOSAL_SUBMITTED.value: 15,
            CaseStage.DISTRICT_REVIEW.value: 21,
            CaseStage.STATE_REVIEW.value: 30,
            CaseStage.SIA_IN_PROGRESS.value: 60,
            CaseStage.NOTIFICATION_PUBLISHED.value: 15,
            CaseStage.OBJECTIONS_WINDOW.value: 60,
            CaseStage.AWARD_DECLARED.value: 30,
            CaseStage.COMPENSATION_DISBURSED.value: 45,
            CaseStage.POSSESSION_TAKEN.value: 30,
            CaseStage.RR_IN_PROGRESS.value: 90,
            CaseStage.COMPLETED.value: 0,
            CaseStage.RETURNED_FOR_CLARIFICATION.value: 15,
            CaseStage.REJECTED.value: 0,
        }
        for stage_name, days in stage_slas.items():
            existing = db.get(StageDurationConfig, stage_name)
            if not existing:
                db.add(StageDurationConfig(stage=stage_name, expected_days=days))
        db.commit()

        print("[INFO] [2/6] Seeding administrative geography (States & Districts)...")
        up = db.query(State).filter_by(name="Uttar Pradesh").first()
        if not up:
            up = State(name="Uttar Pradesh")
            db.add(up)
            db.flush()

        mh = db.query(State).filter_by(name="Maharashtra").first()
        if not mh:
            mh = State(name="Maharashtra")
            db.add(mh)
            db.flush()

        # Districts: Gautam Buddha Nagar (Demo District), Agra, Pune
        gb_nagar = db.query(District).filter_by(name="Gautam Buddha Nagar").first()
        if not gb_nagar:
            gb_nagar = District(name="Gautam Buddha Nagar", state_id=up.id)
            db.add(gb_nagar)
            db.flush()

        agra = db.query(District).filter_by(name="Agra").first()
        if not agra:
            agra = District(name="Agra", state_id=up.id)
            db.add(agra)
            db.flush()

        pune = db.query(District).filter_by(name="Pune").first()
        if not pune:
            pune = District(name="Pune", state_id=mh.id)
            db.add(pune)
            db.flush()
        db.commit()

        print("[INFO] [3/6] Seeding 7 RBAC + ABAC Demo Users (password: password123)...")
        hashed_pwd = get_password_hash("password123")
        demo_users = [
            {
                "name": "Arun Kumar (NHAI Requiring Body)",
                "email": "requiring_body@landsync.gov.in",
                "role": UserRole.REQUIRING_BODY.value,
                "jurisdiction_level": JurisdictionLevel.DISTRICT.value,
                "jurisdiction_id": gb_nagar.id
            },
            {
                "name": "Suhas L.Y. (District Magistrate GB Nagar)",
                "email": "collector@landsync.gov.in",
                "role": UserRole.DISTRICT_COLLECTOR.value,
                "jurisdiction_level": JurisdictionLevel.DISTRICT.value,
                "jurisdiction_id": gb_nagar.id
            },
            {
                "name": "Manish Verma (Principal Secretary Revenue UP)",
                "email": "state_approver@landsync.gov.in",
                "role": UserRole.STATE_APPROVER.value,
                "jurisdiction_level": JurisdictionLevel.STATE.value,
                "jurisdiction_id": up.id
            },
            {
                "name": "Dr. Sunita Rao (Chief SIA Specialist)",
                "email": "sia_expert@landsync.gov.in",
                "role": UserRole.SIA_EXPERT.value,
                "jurisdiction_level": JurisdictionLevel.STATE.value,
                "jurisdiction_id": up.id
            },
            {
                "name": "Virendra Singh (R&R Commissioner)",
                "email": "rr_admin@landsync.gov.in",
                "role": UserRole.RR_ADMINISTRATOR.value,
                "jurisdiction_level": JurisdictionLevel.DISTRICT.value,
                "jurisdiction_id": gb_nagar.id
            },
            {
                "name": "Rajesh Sharma (Tehsildar Jewar)",
                "email": "field_officer@landsync.gov.in",
                "role": UserRole.FIELD_OFFICER.value,
                "jurisdiction_level": JurisdictionLevel.DISTRICT.value,
                "jurisdiction_id": gb_nagar.id
            },
            {
                "name": "Pooja Hegde (Joint Secretary MHA / MoRTH)",
                "email": "policy_viewer@landsync.gov.in",
                "role": UserRole.POLICY_VIEWER.value,
                "jurisdiction_level": JurisdictionLevel.NATIONAL.value,
                "jurisdiction_id": None
            },
            {
                "name": "Hon. Justice V.K. Sharma (Presiding Officer LARR Authority)",
                "email": "larr_authority@landsync.gov.in",
                "role": UserRole.LARR_AUTHORITY.value,
                "jurisdiction_level": JurisdictionLevel.STATE.value,
                "jurisdiction_id": up.id
            },
            {
                "name": "Prof. Ananya Sen (Independent SIA Expert Group Chair)",
                "email": "independent_sia_expert@landsync.gov.in",
                "role": UserRole.INDEPENDENT_SIA_EXPERT.value,
                "jurisdiction_level": JurisdictionLevel.NATIONAL.value,
                "jurisdiction_id": None
            },
            {
                "name": "Dr. K. Radhakrishnan (National R&R Monitoring Committee)",
                "email": "rr_committee@landsync.gov.in",
                "role": UserRole.RR_MONITORING_COMMITTEE.value,
                "jurisdiction_level": JurisdictionLevel.NATIONAL.value,
                "jurisdiction_id": None
            }
        ]

        user_lookup = {}
        for u_data in demo_users:
            u = db.query(User).filter_by(email=u_data["email"]).first()
            if not u:
                u = User(
                    name=u_data["name"],
                    email=u_data["email"],
                    hashed_password=hashed_pwd,
                    role=u_data["role"],
                    jurisdiction_level=u_data["jurisdiction_level"],
                    jurisdiction_id=u_data["jurisdiction_id"],
                    created_at=datetime.now(timezone.utc)
                )
                db.add(u)
                db.flush()
            user_lookup[u_data["role"]] = u
        db.commit()

        print("[INFO] [4/6] Seeding 50 Cadastral Parcels in Gautam Buddha Nagar (Jewar area)...")
        # Generate 5x10 realistic polygon grid around Jewar coordinates (lat 28.18 to 28.23, lon 77.50 to 77.60)
        base_lat = 28.1800
        base_lon = 77.5000
        step = 0.0050  # ~500m
        parcels_list = []

        for i in range(50):
            khasra = f"UP-GB-{10001 + i}"
            p = db.query(Parcel).filter_by(khasra_number=khasra).first()
            if not p:
                row = i // 10
                col = i % 10
                lat1 = base_lat + (row * step)
                lon1 = base_lon + (col * step)
                lat2 = lat1 + 0.0045
                lon2 = lon1 + 0.0045

                # Standard WKT Polygon: Counter-clockwise closed loop
                wkt_poly = f"POLYGON(({lon1} {lat1}, {lon2} {lat1}, {lon2} {lat2}, {lon1} {lat2}, {lon1} {lat1}))"
                area = Decimal(str(round(2.5 + (i * 0.35) % 15.0, 4)))

                p = Parcel(
                    khasra_number=khasra,
                    village="Dayanatpur",
                    tehsil="Jewar",
                    district="Gautam Buddha Nagar",
                    state="Uttar Pradesh",
                    revenue_sheet_no=f"RS-{100 + i}",
                    geometry=WKTElement(wkt_poly, srid=4326),
                    centroid_lat=(lat1 + lat2) / 2.0,
                    centroid_lng=(lon1 + lon2) / 2.0,
                    area_sqm=float(area) * 10000.0,
                    encroachment_status=EncroachmentStatus.CLEAR.value,
                    dispute_status=DisputeStatus.CLEAR.value,
                    ownership_type=OwnershipType.PRIVATE.value
                )
                db.add(p)
                db.flush()
            parcels_list.append(p)
        db.commit()

        print("[INFO] [5/6] Seeding 5 Demonstration Cases across distinct workflow stages...")
        req_user = user_lookup[UserRole.REQUIRING_BODY.value]
        coll_user = user_lookup[UserRole.DISTRICT_COLLECTOR.value]
        state_user = user_lookup[UserRole.STATE_APPROVER.value]
        sia_user = user_lookup[UserRole.SIA_EXPERT.value]
        rr_user = user_lookup[UserRole.RR_ADMINISTRATOR.value]
        now = datetime.now(timezone.utc)

        # Case 1: proposal_submitted
        case1 = db.query(Case).filter_by(project_name="Jewar Airport Rail Cargo Link Phase 1").first()
        if not case1:
            case1 = Case(
                project_name="Jewar Airport Rail Cargo Link Phase 1",
                requiring_body_user_id=req_user.id,
                purpose_category=PurposeCategory.RAILWAYS.value,
                justification="Direct freight corridor connecting Noida International Airport (Jewar) to the Western Dedicated Freight Corridor.",
                estimated_affected_families=42,
                district_id=gb_nagar.id,
                state_id=up.id,
                current_stage=CaseStage.PROPOSAL_SUBMITTED.value,
                stage_entered_at=now - timedelta(days=5),
                created_at=now - timedelta(days=5)
            )
            db.add(case1)
            db.flush()
            # Link parcels 0 to 4
            for p in parcels_list[0:5]:
                case1.parcels.append(p)
            # Audit log
            db.add(AuditLog(
                case_id=case1.id,
                actor_user_id=req_user.id,
                action="proposal_submitted",
                remarks="Submitted acquisition proposal for 5 parcels (freight line corridor).",
                created_at=now - timedelta(days=5)
            ))

        # Case 2: sia_in_progress
        case2 = db.query(Case).filter_by(project_name="Yamuna Expressway Industrial Sector 24").first()
        if not case2:
            case2 = Case(
                project_name="Yamuna Expressway Industrial Sector 24",
                requiring_body_user_id=req_user.id,
                purpose_category=PurposeCategory.INDUSTRIAL_CORRIDOR.value,
                justification="Industrial manufacturing hub development adjacent to Yamuna Expressway.",
                estimated_affected_families=85,
                district_id=gb_nagar.id,
                state_id=up.id,
                current_stage=CaseStage.SIA_IN_PROGRESS.value,
                stage_entered_at=now - timedelta(days=12),
                created_at=now - timedelta(days=45)
            )
            db.add(case2)
            db.flush()
            for p in parcels_list[5:13]:
                case2.parcels.append(p)

            # Chronological Audit Trail
            db.add(AuditLog(
                case_id=case2.id, actor_user_id=req_user.id, action="proposal_submitted",
                remarks="Proposal submitted.", created_at=now - timedelta(days=45)
            ))
            db.add(AuditLog(
                case_id=case2.id, actor_user_id=coll_user.id, action="approved_to_district_review",
                remarks="Collector preliminary scrutiny passed.", created_at=now - timedelta(days=38)
            ))
            db.add(AuditLog(
                case_id=case2.id, actor_user_id=coll_user.id, action="approved_to_state_review",
                remarks="Forwarded with district recommendation.", created_at=now - timedelta(days=25)
            ))
            db.add(AuditLog(
                case_id=case2.id, actor_user_id=state_user.id, action="approved_to_sia_in_progress",
                remarks="State Committee sanctioned SIA assessment.", created_at=now - timedelta(days=12)
            ))

            # SIA Verdict Record
            verdict = SIAVerdict(
                case_id=case2.id,
                agree_public_purpose=True,
                min_land_confirmed=True,
                alternate_location_feasible=False,
                independent_family_estimate=78,
                cost_rating=SIACostRating.MEDIUM.value,
                recommendation=SIARecommendation.PROCEED.value,
                hearing_date=date.today() - timedelta(days=2),
                submitted_by_user_id=sia_user.id,
                submitted_at=now - timedelta(days=1)
            )
            db.add(verdict)
            db.add(AuditLog(
                case_id=case2.id, actor_user_id=sia_user.id, action="sia_verdict_submitted",
                remarks="Expert SIA team recommended proposal for statutory notification.", created_at=now - timedelta(days=1)
            ))

        # Case 3: rr_in_progress (with Affected Families)
        case3 = db.query(Case).filter_by(project_name="Dadri Multimodal Logistics Hub Expansion").first()
        if not case3:
            case3 = Case(
                project_name="Dadri Multimodal Logistics Hub Expansion",
                requiring_body_user_id=req_user.id,
                purpose_category=PurposeCategory.INFRASTRUCTURE.value,
                justification="Inland container depot expansion for Western Freight corridor interchange.",
                estimated_affected_families=120,
                district_id=gb_nagar.id,
                state_id=up.id,
                current_stage=CaseStage.RR_IN_PROGRESS.value,
                stage_entered_at=now - timedelta(days=20),
                created_at=now - timedelta(days=150)
            )
            db.add(case3)
            db.flush()
            for p in parcels_list[13:23]:
                case3.parcels.append(p)

            # Statutory Award
            db.add(Award(
                case_id=case3.id,
                compensation_amount=Decimal("485000000.00"),
                declared_by_user_id=coll_user.id,
                declared_at=now - timedelta(days=60)
            ))

            # R&R Scheme
            db.add(RRScheme(
                case_id=case3.id,
                created_by_user_id=rr_user.id,
                created_at=now - timedelta(days=20)
            ))

            # Affected Families with milestone status logs
            f1 = AffectedFamily(
                case_id=case3.id,
                family_head_name="Ramesh Chandra Sharma",
                current_address="House 42, Village Tilpata Karanwas, Dadri",
                land_reference="Khasra UP-GB-10014 (1.8 Ha)",
                rr_status=RRStatus.RELOCATED.value,
                updated_at=now - timedelta(days=5)
            )
            f2 = AffectedFamily(
                case_id=case3.id,
                family_head_name="Smt. Shakuntala Devi",
                current_address="House 18, Village Pali, Greater Noida",
                land_reference="Khasra UP-GB-10016 (2.2 Ha)",
                rr_status=RRStatus.COMPENSATION_PROCESSED.value,
                updated_at=now - timedelta(days=10)
            )
            f3 = AffectedFamily(
                case_id=case3.id,
                family_head_name="Mohammed Aslam Khan",
                current_address="Main Road, Village Bodaki, Dadri",
                land_reference="Khasra UP-GB-10019 (0.9 Ha)",
                rr_status=RRStatus.SCHEME_COMMUNICATED.value,
                updated_at=now - timedelta(days=18)
            )
            db.add_all([f1, f2, f3])
            db.flush()

            # Status Logs (Append-Only)
            db.add(FamilyStatusLog(
                family_id=f1.id, status=RRStatus.SCHEME_COMMUNICATED.value, remarks="Initial notice served.",
                updated_by_user_id=rr_user.id, updated_at=now - timedelta(days=18)
            ))
            db.add(FamilyStatusLog(
                family_id=f1.id, status=RRStatus.COMPENSATION_PROCESSED.value, remarks="Direct bank transfer validated.",
                updated_by_user_id=rr_user.id, updated_at=now - timedelta(days=12)
            ))
            db.add(FamilyStatusLog(
                family_id=f1.id, status=RRStatus.RELOCATED.value, remarks="Possession handed over at resettlement colony Plot 14B.",
                updated_by_user_id=rr_user.id, updated_at=now - timedelta(days=5)
            ))

            db.add(AuditLog(
                case_id=case3.id, actor_user_id=rr_user.id, action="rr_in_progress",
                remarks="Master R&R scheme initiated for 120 affected families.", created_at=now - timedelta(days=20)
            ))

        # Case 4: completed
        case4 = db.query(Case).filter_by(project_name="Noida Power Grid Substation Alpha").first()
        if not case4:
            case4 = Case(
                project_name="Noida Power Grid Substation Alpha",
                requiring_body_user_id=req_user.id,
                purpose_category=PurposeCategory.POWER.value,
                justification="400kV GIS Substation to support metropolitan power transmission.",
                estimated_affected_families=12,
                district_id=gb_nagar.id,
                state_id=up.id,
                current_stage=CaseStage.COMPLETED.value,
                stage_entered_at=now - timedelta(days=30),
                created_at=now - timedelta(days=320)
            )
            db.add(case4)
            db.flush()
            for p in parcels_list[23:27]:
                case4.parcels.append(p)

            db.add(AuditLog(
                case_id=case4.id, actor_user_id=coll_user.id, action="completed",
                remarks="Acquisition and resettlement concluded. Title vested with state power corporation.",
                created_at=now - timedelta(days=30)
            ))

        # Case 5: district_review
        case5 = db.query(Case).filter_by(project_name="Greater Noida Metro Line Extension Phase 3").first()
        if not case5:
            case5 = Case(
                project_name="Greater Noida Metro Line Extension Phase 3",
                requiring_body_user_id=req_user.id,
                purpose_category=PurposeCategory.METRO.value,
                justification="Aqua line extension connecting Knowledge Park to Pari Chowk interchange.",
                estimated_affected_families=28,
                district_id=gb_nagar.id,
                state_id=up.id,
                current_stage=CaseStage.DISTRICT_REVIEW.value,
                stage_entered_at=now - timedelta(days=8),
                created_at=now - timedelta(days=16)
            )
            db.add(case5)
            db.flush()
            for p in parcels_list[27:33]:
                case5.parcels.append(p)

            db.add(AuditLog(
                case_id=case5.id, actor_user_id=req_user.id, action="proposal_submitted",
                remarks="Submitted metro alignment acquisition proposal.", created_at=now - timedelta(days=16)
            ))
            db.add(AuditLog(
                case_id=case5.id, actor_user_id=coll_user.id, action="approved_to_district_review",
                remarks="Under scrutiny by Additional District Magistrate (Land Acquisition).", created_at=now - timedelta(days=8)
            ))

        # Case 6: compensation_disbursed with active LARR Dispute Referrals
        case6 = db.query(Case).filter_by(project_name="Jewar Aerocity Commercial Sector Phase 2").first()
        if not case6:
            case6 = Case(
                project_name="Jewar Aerocity Commercial Sector Phase 2",
                requiring_body_user_id=req_user.id,
                purpose_category=PurposeCategory.URBAN_DEVELOPMENT.value,
                justification="Aerotropolis hospitality, cargo logistics, and transit facilities.",
                estimated_affected_families=65,
                district_id=gb_nagar.id,
                state_id=up.id,
                current_stage=CaseStage.COMPENSATION_DISBURSED.value,
                stage_entered_at=now - timedelta(days=15),
                created_at=now - timedelta(days=210)
            )
            db.add(case6)
            db.flush()
            for p in parcels_list[33:38]:
                case6.parcels.append(p)

            # Statutory Award
            db.add(Award(
                case_id=case6.id,
                compensation_amount=Decimal("340000000.00"),
                declared_by_user_id=coll_user.id,
                declared_at=now - timedelta(days=45)
            ))

            db.add(AuditLog(
                case_id=case6.id, actor_user_id=coll_user.id, action="compensation_disbursed",
                remarks="Compensation disbursed via PFMS / Aadhaar DBT to 65 affected landowners.",
                created_at=now - timedelta(days=15)
            ))

            # Dispute Referral 1 (Under Hearing with assigned case number and hearing dates)
            ref1 = DisputeReferral(
                case_id=case6.id,
                referred_by_user_id=coll_user.id,
                reason="Landowners filed Section 64 objection: 40% valuation disparity with prevailing commercial circle rates.",
                larr_case_number="LARR/UP/2026/042",
                hearing_dates=["2026-09-24", "2026-10-08"],
                status=DisputeReferralStatus.UNDER_HEARING.value,
                referred_at=now - timedelta(days=12)
            )
            # Dispute Referral 2 (Freshly referred, pending hearing assignment)
            ref2 = DisputeReferral(
                case_id=case6.id,
                referred_by_user_id=coll_user.id,
                reason="Dispute regarding apportionment of 100% solatium and standing timber asset valuation under Section 30.",
                larr_case_number="LARR/UP/2026/058",
                hearing_dates=[],
                status=DisputeReferralStatus.REFERRED.value,
                referred_at=now - timedelta(days=5)
            )
            db.add_all([ref1, ref2])
            db.flush()

            db.add(AuditLog(
                case_id=case6.id, actor_user_id=coll_user.id, action="dispute_referred_to_larr",
                remarks="Referred commercial circle rate valuation dispute to LARR Authority under Section 64.",
                created_at=now - timedelta(days=12)
            ))
            db.add(AuditLog(
                case_id=case6.id, actor_user_id=coll_user.id, action="dispute_referred_to_larr",
                remarks="Referred Section 30 solatium apportionment dispute to LARR Authority.",
                created_at=now - timedelta(days=5)
            ))

        db.commit()
        print("[SUCCESS] [6/6] LandSync Demo Database Seeded Successfully!")
        print("\n--- Demo Login Credentials (all passwords: 'password123') ---")
        for u in demo_users:
            print(f"Role: {u['role']:<22} Email: {u['email']}")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
