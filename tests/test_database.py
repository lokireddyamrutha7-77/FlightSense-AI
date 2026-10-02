import pytest
import uuid
from backend.app.db.session import SessionLocal, init_db
from backend.app.db.crud import create_prediction_log, get_prediction_history, get_prediction_by_id

def test_database_tables_and_crud():
    """Test database table creation and CRUD operations for prediction logs."""
    init_db()
    db = SessionLocal()
    unique_id = f"test_pred_{uuid.uuid4().hex[:8]}"
    try:
        sample_log = {
            "prediction_id": unique_id,
            "flight_number": "AA-1042",
            "carrier": "AA",
            "origin": "JFK",
            "destination": "LAX",
            "scheduled_departure": "2026-09-25T14:30:00Z",
            "distance_miles": 2475.0,
            "delay_probability": 0.384,
            "risk_level": "Moderate Risk",
            "predicted_delay_minutes": 18.5,
            "is_delayed": False,
            "is_mock_data": False,
            "input_features": {"carrier": "AA", "origin": "JFK"},
            "shap_summary": [{"feature": "Distance", "shap_value": -0.05, "impact": "Low"}]
        }

        created = create_prediction_log(db, sample_log)
        assert created.id == unique_id

        fetched = get_prediction_by_id(db, unique_id)
        assert fetched is not None
        assert fetched.flight_number == "AA-1042"

        history = get_prediction_history(db, limit=10)
        assert len(history) >= 1

        # Clean up test record
        db.delete(fetched)
        db.commit()
    finally:
        db.close()

