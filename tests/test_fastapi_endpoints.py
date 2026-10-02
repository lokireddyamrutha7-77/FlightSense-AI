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

