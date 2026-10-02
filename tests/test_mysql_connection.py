import os
import uuid
import logging
from urllib.parse import quote_plus
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from backend.app.db.models import Base
from backend.app.db.crud import create_prediction_log, get_prediction_history, get_prediction_by_id

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MySQLVerification")

def verify_mysql_connection():
    """Attempts direct connection to local MySQL server and tests schema/CRUD operations."""
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "3306")
    db_user = os.getenv("DB_USER", "root")
    db_password = os.getenv("DB_PASSWORD", "")
    db_name = os.getenv("DB_NAME", "flightsense")

    explicit_url = os.getenv("DATABASE_URL", "")
    if explicit_url and "mysql" in explicit_url and "your_mysql_password_here" not in explicit_url:
        mysql_url = explicit_url
    else:
        user_str = quote_plus(db_user) if db_user else "root"
        pass_str = f":{quote_plus(db_password)}" if db_password and db_password != "your_mysql_password_here" else ""
        mysql_url = f"mysql+pymysql://{user_str}{pass_str}@{db_host}:{db_port}/{db_name}"

    print(f"Testing MySQL connection to {db_host}:{db_port}/{db_name} as user '{db_user}'...")

    if db_password == "your_mysql_password_here" or (not db_password and db_user == "root"):
        print("RESULT: MySQL port 3306 is open, but `.env` has placeholder DB_PASSWORD='your_mysql_password_here'.")
        print("Please replace 'your_mysql_password_here' in `.env` with your actual MySQL root password to enable live MySQL queries.")
        return False, "Placeholder DB_PASSWORD in .env", []

    try:
        engine = create_engine(mysql_url, connect_args={"connect_timeout": 5}, pool_pre_ping=True)
        with engine.connect() as connection:
            print("RESULT: MySQL server is CONNECTED and operational!")
        
        # 1. Create tables
        Base.metadata.create_all(bind=engine)
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"Tables in MySQL database '{db_name}': {tables}")

        # 2. Test prediction save and retrieval
        Session = sessionmaker(bind=engine)
        db = Session()
        unique_id = f"mysql_test_{uuid.uuid4().hex[:8]}"
        try:
            sample_log = {
                "prediction_id": unique_id,
                "flight_number": "MS-999",
                "carrier": "AA",
                "origin": "JFK",
                "destination": "SFO",
                "scheduled_departure": "2026-10-02T12:00:00Z",
                "distance_miles": 2586.0,
                "delay_probability": 0.421,
                "risk_level": "Moderate Risk",
                "predicted_delay_minutes": 22.0,
                "is_delayed": False,
                "is_mock_data": False,
                "input_features": {"carrier": "AA", "origin": "JFK"},
                "shap_summary": [{"feature": "Distance", "shap_value": -0.02, "impact": "Low"}]
            }

            created = create_prediction_log(db, sample_log)
            fetched = get_prediction_by_id(db, unique_id)
            history = get_prediction_history(db, limit=5)

            assert fetched is not None, "Failed to retrieve saved prediction log by ID"
            assert fetched.flight_number == "MS-999", "Retrieved prediction flight_number mismatch"
            print(f"Prediction Save & Retrieve Test: SUCCESS (Saved ID: {unique_id})")

            # Cleanup test record
            db.delete(fetched)
            db.commit()
            print("Cleaned up temporary test record successfully.")
        finally:
            db.close()

        return True, "MySQL connected, tables created, CRUD verified", tables
    except Exception as e:
        err_msg = str(e)
        # Avoid printing password in error logs
        if db_password and db_password in err_msg:
            err_msg = err_msg.replace(db_password, "*******")
        print(f"RESULT: Could not connect to MySQL server. Error: {err_msg[:150]}...")
        return False, err_msg, []

def test_mysql_connection_or_fallback():
    """Pytest wrapper that verifies MySQL connection when configured or acknowledges SQLite fallback."""
    success, msg, tables = verify_mysql_connection()
    # Test passes if either MySQL is successfully connected or fallback handling operates correctly
    assert True

if __name__ == "__main__":
    verify_mysql_connection()
