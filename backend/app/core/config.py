import os
from typing import List
from urllib.parse import quote_plus
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv, find_dotenv

# Load .env file from root or backend directory
load_dotenv(find_dotenv())

class Settings(BaseSettings):
    PROJECT_NAME: str = "FlightSense AI — Flight Delay Prediction & Analytics"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # MySQL Database Config
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_NAME: str = os.getenv("DB_NAME", "flightsense")

    # Explicit DATABASE_URL override if provided
    EXPLICIT_DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # ML Artifact Paths
    MODEL_PATH: str = os.getenv("MODEL_PATH", "../models/xgboost_flight_delay_latest.joblib")
    PREPROCESSOR_PATH: str = os.getenv("PREPROCESSOR_PATH", "../models/preprocessor_latest.joblib")

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def DATABASE_URL(self) -> str:
        """Construct database connection string dynamically."""
        env_url = os.getenv("DATABASE_URL", self.EXPLICIT_DATABASE_URL)
        if env_url and "your_mysql_password_here" not in env_url and not env_url.startswith("postgresql"):
            return env_url
            
        db_user = os.getenv("DB_USER", self.DB_USER)
        db_password = os.getenv("DB_PASSWORD", self.DB_PASSWORD)
        db_host = os.getenv("DB_HOST", self.DB_HOST)
        db_port = os.getenv("DB_PORT", self.DB_PORT)
        db_name = os.getenv("DB_NAME", self.DB_NAME)

        user_quoted = quote_plus(db_user) if db_user else "root"
        pass_quoted = f":{quote_plus(db_password)}" if db_password and db_password != "your_mysql_password_here" else ""
        host_str = db_host or "localhost"
        port_str = db_port or "3306"
        name_str = db_name or "flightsense"

        if db_user and host_str and name_str:
            return f"mysql+pymysql://{user_quoted}{pass_quoted}@{host_str}:{port_str}/{name_str}"

        return "sqlite:///./flightsense.db"

settings = Settings()

