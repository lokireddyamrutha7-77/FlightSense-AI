import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_endpoint():
    """Test GET /api/v1/health status endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ml_model_status" in data

def test_predict_endpoint():
    """Test POST /api/v1/predict with real input parameters."""
    payload = {
        "flight_number": "AA-1042",
        "carrier": "AA",
        "origin": "JFK",
        "destination": "LAX",
        "scheduled_departure": "2026-09-25T14:30:00Z",
        "distance_miles": 2475.0,
        "aircraft_type": "Boeing 737-800",
        "temp_celsius": 18.5,
        "wind_speed_knots": 12.0,
        "precipitation_mm": 0.0,
        "visibility_miles": 10.0
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction_id" in data
    assert "delay_probability" in data
    assert "risk_level" in data
    assert "is_delayed" in data
    assert isinstance(data["shap_summary"], list)

def test_predict_what_if_endpoint():
    """Test POST /api/v1/predict/what-if endpoint."""
    payload = {
        "flight_number": "DL-482",
        "carrier": "DL",
        "origin": "ATL",
        "destination": "ORD",
        "scheduled_departure": "2026-09-25T09:15:00Z",
        "distance_miles": 606.0,
        "simulated_carrier": "WN",
        "simulated_origin": "ATL",
        "simulated_destination": "ORD",
        "simulated_scheduled_departure": "2026-09-25T18:00:00Z",
        "simulated_distance_miles": 606.0,
        "wind_speed_delta": 10.0,
        "dep_delay_offset": 30.0,
        "temp_delta": 0.0
    }
    response = client.post("/api/v1/predict/what-if", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "baseline" in data
    assert "simulated" in data
    assert "comparison" in data

def test_analytics_overview_endpoint():
    """Test GET /api/v1/analytics/overview endpoint."""
    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_flights_analyzed" in data
    assert "overall_delay_rate" in data

def test_routes_intelligence_endpoint():
    """Test GET /api/v1/routes/intelligence endpoint."""
    response = client.get("/api/v1/routes/intelligence")
    assert response.status_code == 200
    data = response.json()
    assert "routes" in data

def test_airports_intelligence_endpoint():
    """Test GET /api/v1/airports/intelligence endpoint."""
    response = client.get("/api/v1/airports/intelligence")
    assert response.status_code == 200
    data = response.json()
    assert "airports" in data

def test_airlines_intelligence_endpoint():
    """Test GET /api/v1/airlines/intelligence endpoint."""
    response = client.get("/api/v1/airlines/intelligence")
    assert response.status_code == 200
    data = response.json()
    assert "airlines" in data

def test_model_performance_endpoint():
    """Test GET /api/v1/model/performance endpoint."""
    response = client.get("/api/v1/model/performance")
    assert response.status_code == 200
    data = response.json()
    assert "accuracy" in data
    assert "f1_score" in data
    assert "roc_auc" in data

def test_history_endpoint():
    """Test GET /api/v1/history endpoint."""
    response = client.get("/api/v1/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_auth_register_and_login():
    """Test POST /api/v1/auth/register and /api/v1/auth/login endpoints."""
    import uuid
    email = f"user_{uuid.uuid4().hex[:6]}@flightsense.ai"
    reg_payload = {"email": email, "password": "SecurePassword123", "full_name": "Test User"}
    
    # 1. Register
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == email

    # 2. Login
    login_payload = {"email": email, "password": "SecurePassword123"}
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data

    # 3. Get profile (/auth/me)
    token = login_data["access_token"]
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email


def test_otp_and_phone_auth_flow():
    """Test OTP generation, verification, and phone number registration/login."""
    import uuid
    phone = f"+1555{uuid.uuid4().hex[:7].replace('a','1').replace('b','2').replace('c','3').replace('d','4').replace('e','5').replace('f','6')[:7]}"

    # 1. Request OTP
    otp_req = client.post("/api/v1/auth/signup/request-otp", json={"target": phone, "target_type": "phone", "purpose": "signup"})
    assert otp_req.status_code == 200
    data = otp_req.json()
    assert data["success"] is True
    dev_otp = data["dev_otp"]
    assert dev_otp is not None

    # 2. Verify OTP & Signup
    signup_res = client.post("/api/v1/auth/signup/verify-otp", json={
        "target": phone,
        "target_type": "phone",
        "otp_code": dev_otp,
        "password": "SecurePassword123",
        "full_name": "Phone User"
    })
    assert signup_res.status_code == 200
    token = signup_res.json()["access_token"]
    assert signup_res.json()["user"]["phone_number"] == phone

    # 3. Login with Phone
    login_res = client.post("/api/v1/auth/login", json={"identifier": phone, "password": "SecurePassword123"})
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()


def test_profile_and_saved_flights_flow():
    """Test GET/PUT /profile and saved flights CRUD endpoints."""
    import uuid
    email = f"profile_{uuid.uuid4().hex[:6]}@flightsense.ai"
    reg_res = client.post("/api/v1/auth/register", json={"email": email, "password": "Password123", "full_name": "Profile Tester"})
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get Profile
    prof_res = client.get("/api/v1/profile", headers=headers)
    assert prof_res.status_code == 200
    prof_data = prof_res.json()
    assert prof_data["email"] == email
    assert "stats" in prof_data

    # 2. Update Profile
    update_res = client.put("/api/v1/profile", json={"full_name": "Updated Name", "preferred_airports": ["JFK", "SFO"]}, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["full_name"] == "Updated Name"

    # 3. Add Saved Flight
    saved_res = client.post("/api/v1/saved-flights", json={
        "flight_number": "AA-999",
        "carrier": "AA",
        "origin": "JFK",
        "destination": "SFO"
    }, headers=headers)
    assert saved_res.status_code == 200
    flight_id = saved_res.json()["id"]

    # 4. Get Saved Flights
    list_res = client.get("/api/v1/saved-flights", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 5. Delete Saved Flight
    del_res = client.delete(f"/api/v1/saved-flights/{flight_id}", headers=headers)
    assert del_res.status_code == 200


