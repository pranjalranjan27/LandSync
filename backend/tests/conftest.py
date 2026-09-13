import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.core.security import create_access_token, get_password_hash
from app.models.user import User, State, District
from app.models.enums import UserRole, JurisdictionLevel


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="session")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def test_setup(db_session: Session):
    """Ensure test states, districts, and collectors for Agra & GB Nagar exist."""
    up = db_session.query(State).filter_by(name="Uttar Pradesh").first()
    if not up:
        up = State(name="Uttar Pradesh")
        db_session.add(up)
        db_session.flush()

    gb_nagar = db_session.query(District).filter_by(name="Gautam Buddha Nagar").first()
    if not gb_nagar:
        gb_nagar = District(name="Gautam Buddha Nagar", state_id=up.id)
        db_session.add(gb_nagar)
        db_session.flush()

    agra = db_session.query(District).filter_by(name="Agra").first()
    if not agra:
        agra = District(name="Agra", state_id=up.id)
        db_session.add(agra)
        db_session.flush()

    # Collector for District 1 (GB Nagar)
    c1 = db_session.query(User).filter_by(email="collector_gbnagar@test.gov.in").first()
    if not c1:
        c1 = User(
            name="Test Collector GB Nagar",
            email="collector_gbnagar@test.gov.in",
            hashed_password=get_password_hash("password123"),
            role=UserRole.DISTRICT_COLLECTOR,
            jurisdiction_level=JurisdictionLevel.DISTRICT,
            jurisdiction_id=gb_nagar.id
        )
        db_session.add(c1)

    # Collector for District 2 (Agra)
    c2 = db_session.query(User).filter_by(email="collector_agra@test.gov.in").first()
    if not c2:
        c2 = User(
            name="Test Collector Agra",
            email="collector_agra@test.gov.in",
            hashed_password=get_password_hash("password123"),
            role=UserRole.DISTRICT_COLLECTOR,
            jurisdiction_level=JurisdictionLevel.DISTRICT,
            jurisdiction_id=agra.id
        )
        db_session.add(c2)

    # State Approver (UP)
    sa = db_session.query(User).filter_by(email="state_approver_up@test.gov.in").first()
    if not sa:
        sa = User(
            name="Test State Approver UP",
            email="state_approver_up@test.gov.in",
            hashed_password=get_password_hash("password123"),
            role=UserRole.STATE_APPROVER,
            jurisdiction_level=JurisdictionLevel.STATE,
            jurisdiction_id=up.id
        )
        db_session.add(sa)

    # Patwari / Lekhpal (Field Officer) for Chhapraula village, GB Nagar
    fo = db_session.query(User).filter_by(email="field_officer_gbnagar@test.gov.in").first()
    if not fo:
        fo = User(
            name="Test Patwari Lekhpal GB Nagar",
            email="field_officer_gbnagar@test.gov.in",
            hashed_password=get_password_hash("password123"),
            role=UserRole.PATWARI_LEKHPAL,
            jurisdiction_level=JurisdictionLevel.VILLAGE,
            jurisdiction_id=gb_nagar.id,
            jurisdiction_value="Chhapraula,Bisrakh Jalalpur"
        )
        db_session.add(fo)
    else:
        fo.role = UserRole.PATWARI_LEKHPAL
        fo.jurisdiction_level = JurisdictionLevel.VILLAGE
        fo.jurisdiction_value = "Chhapraula,Bisrakh Jalalpur"

    # Policy Viewer (National)
    pv = db_session.query(User).filter_by(email="policy_viewer@test.gov.in").first()
    if not pv:
        pv = User(
            name="Test Policy Viewer",
            email="policy_viewer@test.gov.in",
            hashed_password=get_password_hash("password123"),
            role=UserRole.POLICY_VIEWER,
            jurisdiction_level=JurisdictionLevel.NATIONAL,
            jurisdiction_id=None
        )
        db_session.add(pv)

    # Requiring Body user
    rb = db_session.query(User).filter_by(email="requiring_body@test.gov.in").first()
    if not rb:
        rb = User(
            name="Test Requiring Body",
            email="requiring_body@test.gov.in",
            hashed_password=get_password_hash("password123"),
            role=UserRole.REQUIRING_BODY,
            jurisdiction_level=JurisdictionLevel.DISTRICT,
            jurisdiction_id=gb_nagar.id
        )
        db_session.add(rb)

    # LARR Authority user (state UP jurisdiction, referral-based access)
    larr = db_session.query(User).filter_by(email="larr_auth@test.gov.in").first()
    if not larr:
        larr = User(
            name="Test LARR Authority",
            email="larr_auth@test.gov.in",
            hashed_password=get_password_hash("password123"),
            role=UserRole.LARR_AUTHORITY,
            jurisdiction_level=JurisdictionLevel.STATE,
            jurisdiction_id=up.id
        )
        db_session.add(larr)

    # Independent SIA Expert Group user (national jurisdiction)
    sia_ind = db_session.query(User).filter_by(email="sia_ind@test.gov.in").first()
    if not sia_ind:
        sia_ind = User(
            name="Test Independent SIA Expert",
            email="sia_ind@test.gov.in",
            hashed_password=get_password_hash("password123"),
            role=UserRole.INDEPENDENT_SIA_EXPERT,
            jurisdiction_level=JurisdictionLevel.NATIONAL,
            jurisdiction_id=None
        )
        db_session.add(sia_ind)

    # R&R Monitoring Committee user (national jurisdiction, read-only)
    rr_comm = db_session.query(User).filter_by(email="rr_comm@test.gov.in").first()
    if not rr_comm:
        rr_comm = User(
            name="Test RR Monitoring Committee",
            email="rr_comm@test.gov.in",
            hashed_password=get_password_hash("password123"),
            role=UserRole.RR_MONITORING_COMMITTEE,
            jurisdiction_level=JurisdictionLevel.NATIONAL,
            jurisdiction_id=None
        )
        db_session.add(rr_comm)

    # Tehsildar user for Dadri tehsil
    teh_dadri = db_session.query(User).filter_by(email="tehsildar_dadri@test.gov.in").first()
    if not teh_dadri:
        teh_dadri = User(
            name="Test Tehsildar Dadri",
            email="tehsildar_dadri@test.gov.in",
            hashed_password=get_password_hash("password123"),
            role=UserRole.TEHSILDAR,
            jurisdiction_level=JurisdictionLevel.TEHSIL,
            jurisdiction_id=gb_nagar.id,
            jurisdiction_value="Dadri"
        )
        db_session.add(teh_dadri)

    # Tehsildar user for Jewar tehsil (other tehsil)
    teh_jewar = db_session.query(User).filter_by(email="tehsildar_jewar@test.gov.in").first()
    if not teh_jewar:
        teh_jewar = User(
            name="Test Tehsildar Jewar",
            email="tehsildar_jewar@test.gov.in",
            hashed_password=get_password_hash("password123"),
            role=UserRole.TEHSILDAR,
            jurisdiction_level=JurisdictionLevel.TEHSIL,
            jurisdiction_id=gb_nagar.id,
            jurisdiction_value="Jewar"
        )
        db_session.add(teh_jewar)

    db_session.commit()

    return {
        "gb_nagar_id": gb_nagar.id,
        "agra_id": agra.id,
        "up_id": up.id,
        "c1_id": c1.id,
        "c2_id": c2.id,
        "sa_id": sa.id,
        "fo_id": fo.id,
        "teh_dadri_id": teh_dadri.id,
        "teh_jewar_id": teh_jewar.id,
        "pv_id": pv.id,
        "rb_id": rb.id,
        "larr_id": larr.id,
        "sia_ind_id": sia_ind.id,
        "rr_comm_id": rr_comm.id
    }


@pytest.fixture(scope="session")
def token_requiring_body(test_setup) -> str:
    return create_access_token(
        subject=test_setup["rb_id"],
        claims={
            "role": UserRole.REQUIRING_BODY.value,
            "jurisdiction_level": JurisdictionLevel.DISTRICT.value,
            "jurisdiction_id": test_setup["gb_nagar_id"]
        }
    )


@pytest.fixture(scope="session")
def token_collector_gbnagar(test_setup) -> str:
    return create_access_token(
        subject=test_setup["c1_id"],
        claims={
            "role": UserRole.DISTRICT_COLLECTOR.value,
            "jurisdiction_level": JurisdictionLevel.DISTRICT.value,
            "jurisdiction_id": test_setup["gb_nagar_id"]
        }
    )


@pytest.fixture(scope="session")
def token_district_collector(token_collector_gbnagar: str) -> str:
    return token_collector_gbnagar


@pytest.fixture(scope="session")
def token_collector_agra(test_setup) -> str:
    return create_access_token(
        subject=test_setup["c2_id"],
        claims={
            "role": UserRole.DISTRICT_COLLECTOR.value,
            "jurisdiction_level": JurisdictionLevel.DISTRICT.value,
            "jurisdiction_id": test_setup["agra_id"]
        }
    )


@pytest.fixture(scope="session")
def token_state_approver(test_setup) -> str:
    return create_access_token(
        subject=test_setup["sa_id"],
        claims={
            "role": UserRole.STATE_APPROVER.value,
            "jurisdiction_level": JurisdictionLevel.STATE.value,
            "jurisdiction_id": test_setup["up_id"]
        }
    )


@pytest.fixture(scope="session")
def token_field_officer(test_setup) -> str:
    return create_access_token(
        subject=test_setup["fo_id"],
        claims={
            "role": UserRole.PATWARI_LEKHPAL.value,
            "jurisdiction_level": JurisdictionLevel.VILLAGE.value,
            "jurisdiction_id": test_setup["gb_nagar_id"],
            "jurisdiction_value": "Chhapraula,Bisrakh Jalalpur"
        }
    )


@pytest.fixture(scope="session")
def token_patwari_lekhpal(test_setup) -> str:
    return create_access_token(
        subject=test_setup["fo_id"],
        claims={
            "role": UserRole.PATWARI_LEKHPAL.value,
            "jurisdiction_level": JurisdictionLevel.VILLAGE.value,
            "jurisdiction_id": test_setup["gb_nagar_id"],
            "jurisdiction_value": "Chhapraula,Bisrakh Jalalpur"
        }
    )


@pytest.fixture(scope="session")
def token_tehsildar(test_setup) -> str:
    return create_access_token(
        subject=test_setup["teh_dadri_id"],
        claims={
            "role": UserRole.TEHSILDAR.value,
            "jurisdiction_level": JurisdictionLevel.TEHSIL.value,
            "jurisdiction_id": test_setup["gb_nagar_id"],
            "jurisdiction_value": "Dadri"
        }
    )


@pytest.fixture(scope="session")
def token_tehsildar_other(test_setup) -> str:
    return create_access_token(
        subject=test_setup["teh_jewar_id"],
        claims={
            "role": UserRole.TEHSILDAR.value,
            "jurisdiction_level": JurisdictionLevel.TEHSIL.value,
            "jurisdiction_id": test_setup["gb_nagar_id"],
            "jurisdiction_value": "Jewar"
        }
    )


@pytest.fixture(scope="session")
def token_policy_viewer(test_setup) -> str:
    return create_access_token(
        subject=test_setup["pv_id"],
        claims={
            "role": UserRole.POLICY_VIEWER.value,
            "jurisdiction_level": JurisdictionLevel.NATIONAL.value,
            "jurisdiction_id": None
        }
    )


@pytest.fixture(scope="session")
def token_larr_authority(test_setup) -> str:
    return create_access_token(
        subject=test_setup["larr_id"],
        claims={
            "role": UserRole.LARR_AUTHORITY.value,
            "jurisdiction_level": JurisdictionLevel.STATE.value,
            "jurisdiction_id": test_setup["up_id"]
        }
    )


@pytest.fixture(scope="session")
def token_independent_sia_expert(test_setup) -> str:
    return create_access_token(
        subject=test_setup["sia_ind_id"],
        claims={
            "role": UserRole.INDEPENDENT_SIA_EXPERT.value,
            "jurisdiction_level": JurisdictionLevel.NATIONAL.value,
            "jurisdiction_id": None
        }
    )


@pytest.fixture(scope="session")
def token_rr_committee(test_setup) -> str:
    return create_access_token(
        subject=test_setup["rr_comm_id"],
        claims={
            "role": UserRole.RR_MONITORING_COMMITTEE.value,
            "jurisdiction_level": JurisdictionLevel.NATIONAL.value,
            "jurisdiction_id": None
        }
    )

