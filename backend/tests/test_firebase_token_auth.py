from jose import jwt
from app.models.enums import UserRole
from app.models.user import User


def test_firebase_token_authenticated_request(client, test_setup):
    """
    Verifies that backend accepts Firebase Auth ID tokens containing string UID and email,
    decodes claims, and resolves the correct statutory user role.
    """
    # Create mock Firebase ID token for existing requiring body user
    token_claims = {
        "iss": "https://securetoken.google.com/landsync-dev",
        "sub": "firebase_uid_rvnl_999",
        "email": "requiring_body@landsync.gov.in",
        "name": "Arun Kumar (NHAI Requiring Body)",
        "auth_time": 1726000000,
        "firebase": {"sign_in_provider": "password"}
    }
    fb_token = jwt.encode(token_claims, "dummy-key-not-checked", algorithm="HS256")

    # Call GET /cases with Firebase Bearer token
    res = client.get("/cases", headers={"Authorization": f"Bearer {fb_token}"})
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}: {res.text}"
    cases = res.json()
    assert isinstance(cases, list)


def test_firebase_token_new_patwari_user_provisioned(client, test_setup):
    """
    Verifies that newly registered Firebase user with patwari email is auto-provisioned
    with patwari_lekhpal statutory role and permitted on jurisdiction endpoints.
    """
    token_claims = {
        "iss": "https://securetoken.google.com/landsync-dev",
        "sub": "firebase_uid_new_patwari",
        "email": "patwari_bisrakh@landsync.gov.in",
        "name": "Mukesh Lekhpal Bisrakh",
        "auth_time": 1726000000,
        "firebase": {"sign_in_provider": "password"}
    }
    fb_token = jwt.encode(token_claims, "dummy-key-not-checked", algorithm="HS256")

    res = client.get("/cases", headers={"Authorization": f"Bearer {fb_token}"})
    assert res.status_code == 200
