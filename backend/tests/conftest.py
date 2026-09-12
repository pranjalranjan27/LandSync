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

    # Field Officer for GB Nagar
    fo = db_session.query(User).filter_by(email="field_officer_gbnagar@test.gov.in").first()
    if not fo:
        fo = User(
            name="Test Field Officer GB Nagar",
            email="field_officer_gbnagar@test.gov.in",
            hashed_password=get_password_hash("password123"),
            role=UserRole.FIELD_OFFICER,
            jurisdiction_level=JurisdictionLevel.DISTRICT,
            jurisdiction_id=gb_nagar.id
        )
        db_session.add(fo)

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

    db_session.commit()

    return {
        "gb_nagar_id": gb_nagar.id,
        "agra_id": agra.id,
        "up_id": up.id,
        "c1_id": c1.id,
        "c2_id": c2.id,
        "sa_id": sa.id,
        "fo_id": fo.id,
        "pv_id": pv.id
    }


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
            "role": UserRole.FIELD_OFFICER.value,
            "jurisdiction_level": JurisdictionLevel.DISTRICT.value,
            "jurisdiction_id": test_setup["gb_nagar_id"]
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

